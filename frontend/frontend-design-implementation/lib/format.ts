import type { CaseStatus, PatternType, RecommendedAction, RiskLevel, Severity } from './types'

export function formatAmount(amount: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount)
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata',
  }).format(new Date(iso))
}

export function formatClock(iso: string) {
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata',
  }).format(new Date(iso))
}

export function formatPercent(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`
}

export function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}m ${s}s`
}

export const PATTERN_LABEL: Record<PatternType, string> = {
  CARD_TESTING: 'Card testing',
  ACCOUNT_TAKEOVER: 'Account takeover',
  MULE_NETWORK: 'Mule network',
  BEHAVIOURAL_ANOMALY: 'Behavioural anomaly',
}

export const ACTION_LABEL: Record<RecommendedAction, string> = {
  APPROVE: 'Approve',
  HOLD: 'Hold',
  ESCALATE: 'Escalate',
  BLOCK: 'Block',
}

export function actionsLabel(actions: RecommendedAction[]) {
  return actions.map((a) => ACTION_LABEL[a]).join(' & ')
}

export const STATUS_LABEL: Record<CaseStatus, string> = {
  AWAITING_DECISION: 'Awaiting decision',
  APPROVED: 'Approved',
  OVERRIDDEN: 'Overridden',
}

export const RISK_STYLE: Record<RiskLevel, { label: string; badge: string; bar: string; text: string; stroke: string }> = {
  LOW: {
    label: 'LOW',
    badge: 'bg-success-soft text-success border-success/30',
    bar: 'bg-success',
    text: 'text-success',
    stroke: '#16a34a',
  },
  MEDIUM: {
    label: 'MEDIUM',
    badge: 'bg-warning-soft text-warning border-warning/30',
    bar: 'bg-warning',
    text: 'text-warning',
    stroke: '#d97706',
  },
  HIGH: {
    label: 'HIGH',
    badge: 'bg-danger-soft text-danger border-danger/30',
    bar: 'bg-danger',
    text: 'text-danger',
    stroke: '#dc2626',
  },
  CRITICAL: {
    label: 'CRITICAL',
    badge: 'bg-danger text-white border-danger',
    bar: 'bg-danger',
    text: 'text-danger',
    stroke: '#b91c1c',
  },
}

export const SEVERITY_STYLE: Record<Severity, string> = {
  LOW: 'bg-muted text-muted-foreground border-border',
  MEDIUM: 'bg-warning-soft text-warning border-warning/30',
  HIGH: 'bg-danger-soft text-danger border-danger/30',
}
