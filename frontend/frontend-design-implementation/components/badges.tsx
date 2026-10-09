import { cn } from '@/lib/utils'
import {
  ACTION_LABEL,
  PATTERN_LABEL,
  RISK_STYLE,
  SEVERITY_STYLE,
  STATUS_LABEL,
} from '@/lib/format'
import type { CaseStatus, PatternType, RecommendedAction, RiskLevel, Severity } from '@/lib/types'

const base = 'inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-semibold leading-4 tracking-wide'

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  return <span className={cn(base, RISK_STYLE[level].badge, className)}>{RISK_STYLE[level].label}</span>
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <span className={cn(base, SEVERITY_STYLE[severity])}>{severity}</span>
}

export function PatternChip({ pattern }: { pattern: PatternType }) {
  return (
    <span className="inline-flex items-center rounded-md border bg-secondary px-1.5 py-0.5 text-[11px] font-medium leading-4 text-secondary-foreground">
      {PATTERN_LABEL[pattern]}
    </span>
  )
}

export function StatusBadge({ status }: { status: CaseStatus }) {
  const styles: Record<CaseStatus, string> = {
    AWAITING_DECISION: 'bg-brand-soft text-brand-dark border-brand/30',
    APPROVED: 'bg-success-soft text-success border-success/30',
    OVERRIDDEN: 'bg-info-soft text-info border-info/30',
  }
  return <span className={cn(base, 'font-medium', styles[status])}>{STATUS_LABEL[status]}</span>
}

export function ActionBadge({ action }: { action: RecommendedAction }) {
  const styles: Record<RecommendedAction, string> = {
    APPROVE: 'bg-success-soft text-success border-success/30',
    HOLD: 'bg-warning-soft text-warning border-warning/30',
    ESCALATE: 'bg-warning-soft text-warning border-warning/30',
    BLOCK: 'bg-danger-soft text-danger border-danger/30',
  }
  return <span className={cn(base, styles[action])}>{ACTION_LABEL[action]}</span>
}
