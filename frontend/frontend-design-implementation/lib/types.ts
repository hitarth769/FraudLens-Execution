export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type PatternType =
  | 'CARD_TESTING'
  | 'ACCOUNT_TAKEOVER'
  | 'MULE_NETWORK'
  | 'BEHAVIOURAL_ANOMALY'

export type CaseStatus = 'AWAITING_DECISION' | 'APPROVED' | 'OVERRIDDEN'

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH'

export type RecommendedAction = 'APPROVE' | 'HOLD' | 'ESCALATE' | 'BLOCK'

export interface HumanDecision {
  decision: 'APPROVE' | 'OVERRIDE'
  overrideAction?: RecommendedAction
  note?: string
  analyst: string
  decidedAt: string
}

export interface CaseSummary {
  caseId: string
  transactionId: string
  amount: number
  currency: string
  customerName: string
  accountId: string
  counterparty: string
  timestamp: string
  riskScore: number
  riskLevel: RiskLevel
  patterns: PatternType[]
  status: CaseStatus
  recommendedActions: RecommendedAction[]
  investigationDurationSec: number
  scenario: string
}

export interface EvidenceItem {
  id: string
  type: string
  pattern: PatternType
  title: string
  claim: string
  observed: string
  baseline: string
  whyItMatters: string
  severity: Severity
  polarity: 'SUPPORTING' | 'CONTRADICTING'
  source: { table: string; eventId: string }
  /** Timeline step that produced this evidence. */
  revealedAtStep: number
}

export interface PatternScore {
  pattern: PatternType
  score: number
  confidence: 'LOW' | 'MEDIUM' | 'HIGH'
  supporting: number
  contradicting: number
}

export interface RiskFactor {
  label: string
  channel: string
  points: number
}

export interface Recommendation {
  actions: RecommendedAction[]
  summary: string
  rationale: { text: string; evidenceIds: string[] }[]
  humanApprovalRequired: boolean
  narrativeSource: 'LLM' | 'TEMPLATE'
}

export interface CaseDetail extends CaseSummary {
  customer: {
    customerId: string
    name: string
    tenure: string
    segment: string
    country: string
  }
  transaction: {
    channel: string
    card: string
    deviceId: string
    ip: string
    location: string
  }
  evidence: EvidenceItem[]
  patternScores: PatternScore[]
  riskFactors: RiskFactor[]
  recommendation: Recommendation
  humanDecision: HumanDecision | null
}

export type TimelineStatus = 'completed' | 'warning' | 'suspicious' | 'failed'

export interface TimelineStep {
  step: number
  label: string
  tool: string
  status: TimelineStatus
  summary: string
  timestamp: string
  durationMs: number
}

export type GraphNodeType =
  | 'customer'
  | 'account'
  | 'device'
  | 'card'
  | 'merchant'
  | 'transaction'
  | 'ip'

export interface GraphNode {
  id: string
  type: GraphNodeType
  label: string
  sublabel: string
  layer: number
  suspicious: boolean
  attributes: Record<string, string>
  revealedAtStep: number
}

export type GraphEdgeKind = 'owns' | 'uses' | 'paid' | 'transferred' | 'logged_in'

export interface GraphEdge {
  id: string
  source: string
  target: string
  kind: GraphEdgeKind
  label?: string
  suspicious: boolean
  revealedAtStep: number
}

export interface CaseGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface Metrics {
  mode: 'fixture' | 'live'
  measured: boolean
  evaluatedAt: string
  overview?: {
    casesPending?: number
    fraudDetected?: number
    falseAlarms?: number
    avgInvestigationSec?: number
    deltas?: { casesPending?: string; fraudDetected?: string; falseAlarms?: string; avgInvestigationSec?: string }
  }
  riskDistribution?: { level: RiskLevel; count: number }[]
  patternDistribution?: { pattern: PatternType; count: number }[]
  evaluation?: {
    testSet: { total: number; fraud: number; benign: number; lookalikes: number }
    confusion: { tp: number; fp: number; tn: number; fn: number }
    precision: number
    recall: number
    f1: number
    falsePositiveRate: number
    avgEvidencePerCase: number
    avgGraphEntities: number
    humanOverrideRate: number
    perPattern: { pattern: string; groundTruth: number; detected: number }[]
    lookalikes: { total: number; correctlyCleared: number; falselyFlagged: number }
  }
}

export interface Health {
  status: 'ok' | 'degraded'
  mode: 'fixture' | 'live'
  llm: 'available' | 'unavailable'
  version: string
}

export interface DecisionRequest {
  decision: 'APPROVE' | 'OVERRIDE'
  overrideAction?: RecommendedAction
  note?: string
}
