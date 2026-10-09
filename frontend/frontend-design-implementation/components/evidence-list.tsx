import { PATTERN_LABEL } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { EvidenceItem } from '@/lib/types'
import { SeverityBadge } from '@/components/badges'
import { EmptyState } from '@/components/state-views'

function EvidenceCard({ item }: { item: EvidenceItem }) {
  const contradicting = item.polarity === 'CONTRADICTING'
  return (
    <article
      id={item.id}
      className={cn(
        'animate-step-in scroll-mt-20 rounded-lg border bg-card p-4',
        contradicting && 'border-success/30 bg-success-soft/40',
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">{PATTERN_LABEL[item.pattern]}</p>
          <h3 className="mt-1 text-base font-semibold leading-snug">{item.title}</h3>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <SeverityBadge severity={item.severity} />
          {contradicting && <span className="text-meta font-medium text-success">Contradicts fraud</span>}
        </div>
      </header>

      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="eyebrow">Observed</dt>
          <dd className="mt-1 font-mono text-sm font-semibold">{item.observed}</dd>
        </div>
        <div>
          <dt className="eyebrow">Baseline</dt>
          <dd className="mt-1 font-mono text-sm text-muted-foreground">{item.baseline}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="eyebrow">Why it matters</dt>
          <dd className="mt-1 text-sm">{item.whyItMatters}</dd>
        </div>
      </dl>

      <footer className="mt-3 flex items-center gap-2 border-t pt-2 text-meta text-muted-foreground">
        <span className="eyebrow">Source</span>
        <span className="font-mono">
          {item.source.table} · {item.source.eventId}
        </span>
        <span className="ml-auto font-mono">{item.id}</span>
      </footer>
    </article>
  )
}

export function EvidenceList({ items }: { items: EvidenceItem[] }) {
  if (items.length === 0) {
    return <EmptyState title="No evidence yet" message="Evidence appears as the investigation progresses." />
  }
  return (
    <div className="grid gap-3 2xl:grid-cols-2">
      {items.map((e) => (
        <EvidenceCard key={e.id} item={e} />
      ))}
    </div>
  )
}
