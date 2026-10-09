import type {
  CaseDetail,
  CaseSummary,
  DecisionRequest,
  HumanDecision,
  Metrics,
  PatternType,
  RiskLevel,
} from '../types'
import { SEED_CASES } from './cases'

const globalStore = globalThis as unknown as { __fraudlensCases?: Map<string, CaseDetail> }

function cases() {
  if (!globalStore.__fraudlensCases) {
    globalStore.__fraudlensCases = new Map(SEED_CASES.map((c) => [c.caseId, structuredClone(c)]))
  }
  return globalStore.__fraudlensCases
}

export function toSummary(c: CaseDetail): CaseSummary {
  return {
    caseId: c.caseId,
    transactionId: c.transactionId,
    amount: c.amount,
    currency: c.currency,
    customerName: c.customerName,
    accountId: c.accountId,
    counterparty: c.counterparty,
    timestamp: c.timestamp,
    riskScore: c.riskScore,
    riskLevel: c.riskLevel,
    patterns: c.patterns,
    status: c.status,
    recommendedActions: c.recommendedActions,
    investigationDurationSec: c.investigationDurationSec,
    scenario: c.scenario,
  }
}

export function listCases(): CaseSummary[] {
  return [...cases().values()].map(toSummary)
}

export function getCase(id: string): CaseDetail | undefined {
  return cases().get(id)
}

export function recordDecision(id: string, body: DecisionRequest): CaseDetail | undefined {
  const current = cases().get(id)
  if (!current) return undefined
  const decision: HumanDecision = {
    decision: body.decision,
    overrideAction: body.decision === 'OVERRIDE' ? body.overrideAction : undefined,
    note: body.note?.trim() || undefined,
    analyst: 'Analyst (demo)',
    decidedAt: new Date().toISOString(),
  }
  const updated: CaseDetail = {
    ...current,
    humanDecision: decision,
    status: body.decision === 'APPROVE' ? 'APPROVED' : 'OVERRIDDEN',
  }
  cases().set(id, updated)
  return updated
}

const LEVELS: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const PATTERNS: PatternType[] = ['CARD_TESTING', 'ACCOUNT_TAKEOVER', 'MULE_NETWORK', 'BEHAVIOURAL_ANOMALY']

export function buildMetrics(): Metrics {
  const all = listCases()
  const pending = all.filter((c) => c.status === 'AWAITING_DECISION').length
  const highRisk = all.filter((c) => c.riskLevel === 'HIGH' || c.riskLevel === 'CRITICAL').length
  const lowRisk = all.filter((c) => c.riskLevel === 'LOW').length
  const avg = all.reduce((sum, c) => sum + c.investigationDurationSec, 0) / Math.max(all.length, 1)

  // Evaluation figures are placeholders until scripts/evaluate.py output is wired in.
  const confusion = { tp: 54, fp: 9, tn: 331, fn: 6 }
  const precision = confusion.tp / (confusion.tp + confusion.fp)
  const recall = confusion.tp / (confusion.tp + confusion.fn)

  return {
    mode: 'fixture',
    measured: false,
    evaluatedAt: '2026-10-08T00:00:00+05:30',
    overview: {
      casesPending: pending,
      fraudDetected: highRisk,
      falseAlarms: lowRisk,
      avgInvestigationSec: Number(avg.toFixed(1)),
      deltas: {
        casesPending: 'Awaiting analyst decision',
        fraudDetected: 'High and critical risk',
        falseAlarms: 'Cleared as low risk',
        avgInvestigationSec: 'Per case, automated',
      },
    },
    riskDistribution: LEVELS.map((level) => ({ level, count: all.filter((c) => c.riskLevel === level).length })),
    patternDistribution: PATTERNS.map((pattern) => ({
      pattern,
      count: all.filter((c) => c.patterns.includes(pattern)).length,
    })),
    evaluation: {
      testSet: { total: 400, fraud: 60, benign: 340, lookalikes: 40 },
      confusion,
      precision,
      recall,
      f1: (2 * precision * recall) / (precision + recall),
      falsePositiveRate: confusion.fp / (confusion.fp + confusion.tn),
      avgEvidencePerCase: 7.4,
      avgGraphEntities: 6.8,
      humanOverrideRate: 0.12,
      perPattern: [
        { pattern: 'CARD_TESTING', groundTruth: 20, detected: 19 },
        { pattern: 'ACCOUNT_TAKEOVER', groundTruth: 20, detected: 18 },
        { pattern: 'MULE_NETWORK', groundTruth: 12, detected: 10 },
        { pattern: 'COMBINED_FRAUD', groundTruth: 8, detected: 7 },
      ],
      lookalikes: { total: 40, correctlyCleared: 34, falselyFlagged: 6 },
    },
  }
}
