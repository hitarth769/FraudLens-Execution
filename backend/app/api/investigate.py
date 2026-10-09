import time
import hashlib
import json
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.models import Case as CaseModel, Transaction as TransactionModel, SessionLocal, Account as AccountModel, Customer as CustomerModel, LoginEvent, InvestigationAudit
from app.schemas.models import CaseDetail, PatternScore
from app.investigation.context import InvestigationContext
from app.services.llm import llm_service

# Tool imports
from app.tools.get_transaction import get_transaction
from app.tools.get_customer_history import get_customer_history
from app.tools.analyze_velocity import analyze_velocity
from app.tools.analyze_device import analyze_device
from app.tools.investigate_network import investigate_network
from app.tools.analyze_location import analyze_location

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def execute_tool(ctx: InvestigationContext, db: Session, tool_fn, label: str, tool_name: str, **kwargs):
    start = time.time()
    try:
        result = tool_fn(db, **kwargs)
        duration = int((time.time() - start) * 1000)

        if result and result.success:
            # Add evidence and set revealedAtStep
            for ev in result.evidence:
                ev.revealedAtStep = ctx.current_step + 1
                ctx.evidence[ev.id] = ev

            ctx.add_timeline_step(label, tool_name, "completed", result.data.get("summary", "Execution successful"), duration)
            return result
        else:
            error_msg = result.error if result else "Tool returned no result"
            ctx.add_timeline_step(label, tool_name, "failed", error_msg or "Tool failed", duration)
            return result
    except Exception as e:
        duration = int((time.time() - start) * 1000)
        ctx.add_timeline_step(label, tool_name, "failed", f"Error: {str(e)}", duration)
        return None

def run_orchestrator(ctx: InvestigationContext, db: Session):
    # To resolve dependencies between tools, we fetch the core IDs first
    case = db.query(CaseModel).filter(CaseModel.id == ctx.case_id).first()
    txn = db.query(TransactionModel).filter(TransactionModel.id == case.transaction_id).first()
    acc = db.query(AccountModel).filter(AccountModel.id == txn.account_id).first()
    cust = db.query(CustomerModel).filter(CustomerModel.id == acc.customer_id).first()
    txn_ts = txn.timestamp

    # Find current device from most recent login
    last_login = db.query(LoginEvent).filter(LoginEvent.account_id == acc.id).order_by(LoginEvent.timestamp.desc()).first()
    device_id = last_login.device_id if last_login else None

    # --- Phase 5: Evidence Tools ---
    res_txn = execute_tool(ctx, db, get_transaction, "Transaction context retrieved", "get_transaction", transaction_id=txn.id)
    # Passing txn_ts to ensure causal temporal checks in tools
    execute_tool(ctx, db, get_customer_history, "Customer baseline calculated", "get_customer_history", customer_id=cust.id, current_txn_amount=txn.amount, current_txn_id=txn.id, txn_timestamp=txn_ts)
    res_vel = execute_tool(ctx, db, analyze_velocity, "Velocity analysed", "analyze_velocity", account_id=acc.id, current_txn_id=txn.id)
    execute_tool(ctx, db, analyze_device, "Device anomaly detected", "analyze_device", account_id=acc.id, current_device_id=device_id)
    execute_tool(ctx, db, analyze_location, "Location anomaly detected", "analyze_location", account_id=acc.id, current_txn_id=txn.id)

    # Mule behavior analysis
    from app.tools.analyze_mule_behavior import analyze_mule_behavior
    execute_tool(ctx, db, analyze_mule_behavior, "Mule behavior analyzed", "analyze_mule_behavior", account_id=acc.id)

    network_res = execute_tool(ctx, db, investigate_network, "Network expanded", "investigate_network", account_id=acc.id)
    if network_res and network_res.success:
        ctx.graph_nodes = network_res.data.get("nodes", [])
        ctx.graph_edges = network_res.data.get("edges", [])

    # Login Proximity Evidence
    last_login = db.query(LoginEvent).filter(
        LoginEvent.account_id == acc.id,
        LoginEvent.device_id == device_id,
        LoginEvent.timestamp <= txn_ts
    ).order_by(LoginEvent.timestamp.desc()).first()

    if last_login:
        time_diff = (txn_ts - last_login.timestamp).total_seconds()
        if 0 <= time_diff <= 3600: # Within 1 hour AND occurred BEFORE txn
            from app.tools.base import EvidenceItem, generate_evidence_id
            from app.schemas.models import Severity
            ctx.evidence[generate_evidence_id("orchestrator", txn.id, 1)] = EvidenceItem(
                id=generate_evidence_id("orchestrator", txn.id, 1),
                type="LOGIN_PROXIMITY",
                pattern="ACCOUNT_TAKEOVER",
                title="Login proximity detected",
                claim="Login from the transaction device occurred within 1 hour before the transaction",
                observed=f"Login {time_diff/60:.1f} minutes before txn",
                baseline="N/A",
                whyItMatters="Provides context on device usage immediately preceding the transaction",
                severity=Severity.MEDIUM,
                polarity="SUPPORTING",
                source={"table": "logins", "eventId": last_login.id},
                revealedAtStep=ctx.current_step + 1
            )



    # --- Phase 6: Detectors ---
    from app.detectors.card_testing import detect_card_testing
    from app.detectors.account_takeover import detect_account_takeover

    # Prepare data for card testing detector
    detector_data = {
        "velocity": res_vel.data.get("velocity", {}) if res_vel and res_vel.success else {},
        "distinct_cards": res_txn.data.get("distinct_cards", 0) if res_txn and res_txn.success else 0,
        "amount": res_txn.data.get("transaction", {}).get("amount", 0) if res_txn and res_txn.success else 0,
        "decline_count": res_vel.data.get("decline_count", 0) if res_vel and res_vel.success else 0,
        "total_count": res_txn.data.get("total_count", 1) if res_txn and res_txn.success else 1,
    }

    det_res_ct = detect_card_testing(ctx.evidence, detector_data)
    det_res_ato = detect_account_takeover(ctx.evidence, {})
    from app.detectors.mule_network import detect_mule_network
    det_res_mule = detect_mule_network(ctx.evidence, {})

    # Record the detector execution in the timeline
    ctx.add_timeline_step(
        "Fraud patterns evaluated",
        "detectors",
        "suspicious" if (det_res_ct.detected or det_res_ato.detected or det_res_mule.detected) else "completed",
        f"Card Testing: {det_res_ct.score}, ATO: {det_res_ato.score}, Mule: {det_res_mule.score}",
        150 # Estimated duration
    )

    # Add to PatternScores
    ctx.pattern_scores.append(PatternScore(
        pattern=det_res_ct.pattern,
        score=det_res_ct.score,
        confidence="HIGH",
        supporting=len(det_res_ct.signals),
        contradicting=0
    ))
    ctx.pattern_scores.append(PatternScore(
        pattern=det_res_ato.pattern,
        score=det_res_ato.score,
        confidence="HIGH",
        supporting=len(det_res_ato.signals),
        contradicting=0
    ))
    ctx.pattern_scores.append(PatternScore(
        pattern=det_res_mule.pattern,
        score=det_res_mule.score,
        confidence="HIGH",
        supporting=len(det_res_mule.signals),
        contradicting=0
    ))



    # Placeholder for future phases
    ctx.add_timeline_step("Evidence consolidated", "build_evidence", "completed", "Evidence consolidated", 50)
    ctx.add_timeline_step("Risk score calculated", "calculate_risk", "completed", "Risk score pending", 50)
    ctx.add_timeline_step("Recommendation generated", "generate_recommendation", "completed", "Rec pending", 50)





@router.get("/cases/{case_id}/verify-audit")
def verify_audit_chain(case_id: str, db: Session = Depends(get_db)):
    """Verify the integrity of the hash-linked investigation audit chain."""
    audit_events = db.query(InvestigationAudit).filter(
        InvestigationAudit.case_id == case_id
    ).order_by(InvestigationAudit.id.asc()).all()

    if not audit_events:
        return {"status": "no_audit_trail", "message": "No audit events found for this case."}

    verified_count = 0
    for i in range(len(audit_events)):
        event = audit_events[i]

        # 1. Verify the event hash
        prev_hash = audit_events[i-1].event_hash if i > 0 else None

        # Recompute hash: SHA-256(event_id + timestamp + actor + action + evidence_digest + prev_hash)
        hash_payload = f"{event.event_id}{event.timestamp.isoformat()}{event.actor}{event.action}{event.evidence_digest}{prev_hash or ''}"
        computed_hash = hashlib.sha256(hash_payload.encode()).hexdigest()

        if computed_hash != event.event_hash:
            return {
                "status": "corrupted",
                "event_id": event.event_id,
                "error": "Event hash mismatch. Data may have been altered.",
                "index": i
            }

        # 2. Verify the chain link
        if i > 0 and event.previous_event_hash != audit_events[i-1].event_hash:
            return {
                "status": "broken_chain",
                "event_id": event.event_id,
                "error": "Previous event hash mismatch. Sequence may have been altered.",
                "index": i
            }

        verified_count += 1

    return {
        "status": "verified",
        "events_verified": verified_count,
        "message": "Audit chain integrity confirmed."
    }

@router.post("/cases/{case_id}/investigate", response_model=CaseDetail)
def investigate(case_id: str, db: Session = Depends(get_db)):
    case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    txn = db.query(TransactionModel).filter(TransactionModel.id == case.transaction_id).first()
    acc = db.query(AccountModel).filter(AccountModel.id == txn.account_id).first()
    cust = db.query(CustomerModel).filter(CustomerModel.id == acc.customer_id).first()

    ctx = InvestigationContext(
        case_id=case.id,
        transaction_id=case.transaction_id,
        start_time=datetime.now()
    )

    run_orchestrator(ctx, db)

    # --- Risk Aggregation ---
    # Calculate max score from pattern scores to determine risk level
    max_score = 0
    if ctx.pattern_scores:
        max_score = max(ps.score for ps in ctx.pattern_scores)

    risk_level = "LOW"
    if max_score >= 80:
        risk_level = "CRITICAL"
    elif max_score >= 60:
        risk_level = "HIGH"
    elif max_score >= 30:
        risk_level = "MEDIUM"

    # Update case in DB
    case.risk_score = max_score
    case.risk_level = risk_level
    case.recommended_action = "BLOCK" if risk_level in ["CRITICAL", "HIGH"] else "APPROVE"
    db.commit()

    # --- Audit Chaining ---
    # 1. Get previous event hash for this case
    last_audit = db.query(InvestigationAudit).filter(
        InvestigationAudit.case_id == case.id
    ).order_by(InvestigationAudit.id.desc()).first()
    prev_hash = last_audit.event_hash if last_audit else None

    # 2. Compute evidence digest
    evidence_digest = ctx.compute_evidence_digest()

    # 3. Create current event
    event_id = str(uuid.uuid4())
    timestamp = datetime.now()
    actor = "SYSTEM_ORCHESTRATOR"
    action = "INVESTIGATION_COMPLETED"

    # Event Hash = SHA-256(event_id + timestamp + actor + action + evidence_digest + prev_hash)
    hash_payload = f"{event_id}{timestamp.isoformat()}{actor}{action}{evidence_digest}{prev_hash or ''}"
    event_hash = hashlib.sha256(hash_payload.encode()).hexdigest()

    audit_entry = InvestigationAudit(
        case_id=case.id,
        event_id=event_id,
        timestamp=timestamp,
        actor=actor,
        action=action,
        evidence_digest=evidence_digest,
        previous_event_hash=prev_hash,
        event_hash=event_hash
    )
    db.add(audit_entry)
    db.commit()

    # --- LLM Synthesis ---
    narrative = llm_service.generate_narrative(ctx.evidence, ctx.pattern_scores)
    narrative_source = "LLM"

    if not narrative:
        # Deterministic Fallback Narrative
        pattern_summaries = [f"{ps.pattern} ({ps.score}/100)" for ps in ctx.pattern_scores]
        summary_text = "Investigation completed based on deterministic rules. "
        if pattern_summaries:
            summary_text += "Detected patterns: " + ", ".join(pattern_summaries) + "."
        else:
            summary_text += "No significant fraud patterns detected."

        narrative = summary_text
        narrative_source = "TEMPLATE"

    return CaseDetail(
        caseId=case.id,
        transactionId=txn.id,
        amount=txn.amount,
        currency=txn.currency,
        customerName=cust.name,
        accountId=acc.id,
        counterparty="Unknown",
        timestamp=txn.timestamp.isoformat(),
        riskScore=case.risk_score or 0,
        riskLevel=case.risk_level or "LOW",
        patterns=[ps.pattern for ps in ctx.pattern_scores if ps.score > 0],
        status=case.status,
        recommendedActions=[case.recommended_action],
        investigationDurationSec=0.0,
        scenario=case.ground_truth_patterns or "Unknown",
        customer={
            "customerId": cust.id,
            "name": cust.name,
            "tenure": cust.tenure,
            "segment": cust.segment,
            "country": cust.country,
        },
        transaction={
            "channel": txn.channel,
            "card": "Unknown",
            "deviceId": "Unknown",
            "ip": txn.ip,
            "location": txn.location,
        },
        evidence=list(ctx.evidence.values()),
        patternScores=ctx.pattern_scores,
        riskFactors=ctx.risk_factors,
        recommendation={
            "actions": [case.recommended_action],
            "summary": narrative,
            "rationale": [],
            "humanApprovalRequired": True,
            "narrativeSource": narrative_source
        },
        humanDecision=None
    )

