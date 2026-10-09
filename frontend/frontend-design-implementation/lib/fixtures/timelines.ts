import type { TimelineStatus, TimelineStep } from '../types'

type StepSpec = [label: string, tool: string, status: TimelineStatus, summary: string, durationMs: number]

function build(startIso: string, specs: StepSpec[]): TimelineStep[] {
  let t = new Date(startIso).getTime()
  return specs.map(([label, tool, status, summary, durationMs], i) => {
    t += 1400
    return {
      step: i + 1,
      label,
      tool,
      status,
      summary,
      durationMs,
      timestamp: new Date(t).toISOString(),
    }
  })
}

const tl1001 = build('2026-10-08T14:03:40+05:30', [
  ['Transaction context retrieved', 'get_transaction', 'completed', 'TXN-50102 · ₹1 · declined · merchant M-102', 180],
  ['Customer baseline calculated', 'get_customer_history', 'completed', '90-day baseline: 1 card, 0 declines', 410],
  ['Velocity anomaly detected', 'analyze_velocity', 'warning', '29 attempts across 14 cards in 11 minutes', 520],
  ['Device relationship analysed', 'analyze_device', 'suspicious', 'Device D555 attached to 14 distinct cards', 460],
  ['Network expansion skipped', 'investigate_network', 'completed', 'No multi-account links — expansion not justified', 90],
  ['Card-testing pattern detected', 'detect_card_testing', 'suspicious', 'Score 93 · 5 supporting signals', 310],
  ['Evidence consolidated', 'build_evidence', 'completed', '5 evidence objects, 1 contradicting', 140],
  ['Risk score calculated', 'calculate_risk', 'completed', 'Risk score 94/100 · CRITICAL', 60],
  ['Recommendation generated', 'generate_recommendation', 'completed', 'Block recommended · awaiting analyst', 920],
])

const tl1002 = build('2026-10-08T02:44:10+05:30', [
  ['Transaction context retrieved', 'get_transaction', 'completed', 'TXN-50188 · ₹72,500 · gift cards', 200],
  ['Customer baseline calculated', 'get_customer_history', 'completed', '212 logins, 1 device, median spend ₹2,400', 430],
  ['Velocity analysed', 'analyze_velocity', 'completed', 'Single transaction — no burst', 150],
  ['Device anomaly detected', 'analyze_device', 'warning', 'D774 never seen on this account', 380],
  ['Network expansion', 'investigate_network', 'completed', 'D774 linked to 3 other accounts', 540],
  ['Account-takeover pattern detected', 'detect_account_takeover', 'suspicious', 'Score 89 · 5 supporting signals', 290],
  ['Evidence consolidated', 'build_evidence', 'completed', '6 evidence objects, 1 contradicting', 130],
  ['Risk score calculated', 'calculate_risk', 'completed', 'Risk score 87/100 · HIGH', 60],
  ['Recommendation generated', 'generate_recommendation', 'completed', 'Hold & escalate recommended', 880],
])

const tl1003 = build('2026-10-08T11:21:05+05:30', [
  ['Transaction context retrieved', 'get_transaction', 'completed', 'TXN-50244 · ₹31,000 · to A-5520', 210],
  ['Recipient baseline calculated', 'get_customer_history', 'completed', 'Account is 19 days old, 4 inbound in 24h', 400],
  ['Velocity analysed', 'analyze_velocity', 'warning', 'Inbound ₹71,500 in 9 minutes', 480],
  ['Device relationship analysed', 'analyze_device', 'completed', 'No shared devices', 220],
  ['Network expanded (depth 2)', 'investigate_network', 'completed', '3 senders, 2 onward hops, 1 cash-out account', 760],
  ['Mule pattern detected', 'detect_mule_network', 'suspicious', 'Score 91 · fan-in / fan-out with 96% pass-through', 330],
  ['Evidence consolidated', 'build_evidence', 'completed', '5 evidence objects, 0 contradicting', 120],
  ['Risk score calculated', 'calculate_risk', 'completed', 'Risk score 89/100 · HIGH', 60],
  ['Recommendation generated', 'generate_recommendation', 'completed', 'Hold & escalate recommended', 860],
])

const tl1004 = build('2026-10-08T09:18:30+05:30', [
  ['Transaction context retrieved', 'get_transaction', 'completed', 'TXN-50210 · ₹21,400 · Heathrow Duty Free', 190],
  ['Customer baseline calculated', 'get_customer_history', 'completed', '7-year tenure, 14 foreign transactions in 12 months', 450],
  ['Velocity analysed', 'analyze_velocity', 'completed', 'Within normal range', 140],
  ['Device anomaly noted', 'analyze_device', 'warning', 'New device D201 · MFA passed · same city as card', 360],
  ['Network expansion skipped', 'investigate_network', 'completed', 'No linked accounts — expansion not justified', 80],
  ['Fraud detectors executed', 'detect_*', 'completed', 'No pattern above threshold · behavioural anomaly 31', 520],
  ['Evidence consolidated', 'build_evidence', 'completed', '2 supporting, 3 contradicting', 110],
  ['Risk score calculated', 'calculate_risk', 'completed', 'Risk score 24/100 · LOW', 60],
  ['Recommendation generated', 'generate_recommendation', 'completed', 'Approve recommended', 640],
])

const tl1005 = build('2026-10-08T03:19:10+05:30', [
  ['Transaction context retrieved', 'get_transaction', 'completed', 'TXN-50291 · ₹48,000 · bank transfer to A-9902', 190],
  ['Customer baseline calculated', 'get_customer_history', 'completed', '90-day median ₹1,850 · 1 device · Pune, IN', 420],
  ['Velocity analysed', 'analyze_velocity', 'warning', 'Amount 25.9× median; first transfer in 214 days', 160],
  ['Device anomaly detected', 'analyze_device', 'warning', 'D981 never seen on this account; linked to 4 others', 390],
  ['Network expanded (depth 2)', 'investigate_network', 'completed', 'Recipient A-9902 + 3 onward accounts discovered', 780],
  ['Mule pattern detected', 'detect_mule_network', 'suspicious', 'Fan-out to 3 accounts in 14 min · 97% pass-through', 340],
  ['Evidence consolidated', 'build_evidence', 'completed', '9 supporting, 1 contradicting', 150],
  ['Risk score calculated', 'calculate_risk', 'completed', 'Risk score 91/100 · HIGH', 70],
  ['Recommendation generated', 'generate_recommendation', 'completed', 'Hold & escalate · human approval required', 1010],
])

export const TIMELINES: Record<string, TimelineStep[]> = {
  'CASE-1001': tl1001,
  'CASE-1002': tl1002,
  'CASE-1003': tl1003,
  'CASE-1004': tl1004,
  'CASE-1005': tl1005,
  'CASE-1006': tl1001,
  'CASE-1007': tl1004,
  'CASE-1008': tl1002,
}
