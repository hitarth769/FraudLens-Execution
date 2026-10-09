'use client'

import { AlertOctagon, AlertTriangle, Check, X } from 'lucide-react'
import { useTimeline } from '@/lib/api'
import { formatClock } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { TimelineStatus } from '@/lib/types'
import { EmptyState, ErrorState, Skeleton } from '@/components/state-views'

const STATUS: Record<TimelineStatus, { icon: typeof Check; dot: string; label: string }> = {
  completed: { icon: Check, dot: 'bg-success-soft text-success border-success/40', label: 'Completed' },
  warning: { icon: AlertTriangle, dot: 'bg-warning-soft text-warning border-warning/40', label: 'Warning' },
  suspicious: { icon: AlertOctagon, dot: 'bg-danger text-white border-danger', label: 'Suspicious' },
  failed: { icon: X, dot: 'bg-muted text-muted-foreground border-border', label: 'Failed' },
}

export function TimelineView({ caseId, revealStep }: { caseId: string; revealStep: number }) {
  const { data, error, isLoading, mutate } = useTimeline(caseId)

  if (isLoading) return <Skeleton className="h-56 w-full" />
  if (error) return <ErrorState title="Could not load timeline" message={error.message} onRetry={() => mutate()} />
  if (!data || data.length === 0) {
    return <EmptyState title="No investigation steps yet" message="Run an investigation to see how the agent worked." />
  }

  const visible = data.filter((s) => s.step <= revealStep)

  return (
    <ol className="relative" aria-label="Investigation steps">
      {visible.map((s, i) => {
        const cfg = STATUS[s.status]
        const Icon = cfg.icon
        const last = i === visible.length - 1
        return (
          <li key={s.step} className="animate-step-in relative flex gap-3 pb-4 last:pb-0">
            {!last && <span aria-hidden="true" className="absolute left-[11px] top-6 bottom-0 w-px bg-border" />}
            <span
              className={cn('relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border', cfg.dot)}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              <span className="sr-only">{cfg.label}</span>
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className={cn('text-sm font-medium', s.status === 'suspicious' && 'text-danger')}>{s.label}</p>
                <time dateTime={s.timestamp} className="tabular shrink-0 font-mono text-[11px] text-muted-foreground">
                  {formatClock(s.timestamp)}
                </time>
              </div>
              <p className="mt-0.5 text-meta text-muted-foreground">{s.summary}</p>
              <p className="mt-0.5 font-mono text-[11px] text-muted-foreground/80">
                {s.tool} · {s.durationMs}ms
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
