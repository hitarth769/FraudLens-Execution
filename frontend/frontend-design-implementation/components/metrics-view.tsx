'use client'

import { Info } from 'lucide-react'
import { useMetrics } from '@/lib/api'
import { formatPercent } from '@/lib/format'
import type { Metrics } from '@/lib/types'
import { DistributionBars } from '@/components/distribution-bars'
import { ErrorState, Skeleton } from '@/components/state-views'
import { StatCard } from '@/components/stat-card'

function Panel({ id, title, subtitle, children }: { id: string; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-lg border bg-card p-5">
      <h2 id={id} className="text-base font-semibold">
        {title}
      </h2>
      {subtitle && <p className="mt-0.5 text-meta text-muted-foreground">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

function ConfusionMatrix({ c }: { c: Metrics['evaluation']['confusion'] }) {
  const cells = [
    { label: 'True positive', sub: 'Fraud caught', value: c.tp, tone: 'bg-success-soft text-success' },
    { label: 'False positive', sub: 'False alarm', value: c.fp, tone: 'bg-warning-soft text-warning' },
    { label: 'False negative', sub: 'Fraud missed', value: c.fn, tone: 'bg-danger-soft text-danger' },
    { label: 'True negative', sub: 'Correctly cleared', value: c.tn, tone: 'bg-muted text-foreground' },
  ]
  return (
    <div className="grid grid-cols-2 gap-2" role="table" aria-label="Confusion matrix">
      {cells.map((cell) => (
        <div key={cell.label} role="cell" className={`rounded-md p-3 ${cell.tone}`}>
          <p className="tabular text-2xl font-semibold">{cell.value}</p>
          <p className="text-sm font-medium">{cell.label}</p>
          <p className="text-meta opacity-80">{cell.sub}</p>
        </div>
      ))}
    </div>
  )
}

export function MetricsView() {
  const { data, error, isLoading, mutate } = useMetrics()

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    )
  }
  if (error || !data) return <ErrorState title="Could not load metrics" message={error?.message} onRetry={() => mutate()} />

  const ev = data.evaluation

  return (
    <div className="space-y-6">
      {!data.measured && (
        <div role="note" className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning-soft px-4 py-3 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
          <p>
            <strong className="font-semibold">Illustrative fixture values.</strong> These evaluation numbers are placeholders
            and have not been measured. Connect the evaluation script to show results from a held-out test set.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Precision" value={formatPercent(ev.precision)} hint="Flagged cases that were fraud" tone="brand" />
        <StatCard label="Recall" value={formatPercent(ev.recall)} hint="Fraud cases that were caught" tone="brand" />
        <StatCard label="F1 score" value={formatPercent(ev.f1)} hint="Balance of precision and recall" />
        <StatCard label="False-positive rate" value={formatPercent(ev.falsePositiveRate)} hint="Benign cases wrongly flagged" tone="danger" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          id="confusion-heading"
          title="Confusion matrix"
          subtitle={`${ev.testSet.total} held-out cases · ${ev.testSet.fraud} fraud · ${ev.testSet.benign} benign`}
        >
          <ConfusionMatrix c={ev.confusion} />
        </Panel>

        <Panel
          id="pattern-heading"
          title="Detection by fraud pattern"
          subtitle="Detected out of planted ground truth"
        >
          <ul className="space-y-4">
            {ev.perPattern.map((p) => {
              const rate = p.groundTruth ? p.detected / p.groundTruth : 0
              return (
                <li key={p.pattern}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="capitalize">{p.pattern.replace(/_/g, ' ').toLowerCase()}</span>
                    <span className="tabular text-muted-foreground">
                      <strong className="font-semibold text-foreground">{p.detected}</strong> / {p.groundTruth} ·{' '}
                      {formatPercent(rate, 0)}
                    </span>
                  </div>
                  <div
                    role="img"
                    aria-label={`${p.detected} of ${p.groundTruth} detected`}
                    className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted"
                  >
                    <div className="h-full rounded-full bg-brand" style={{ width: `${rate * 100}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
        </Panel>

        <Panel
          id="lookalike-heading"
          title="Benign look-alikes"
          subtitle="Legitimate activity that resembles fraud"
        >
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Tested" value={ev.lookalikes.total} />
            <StatCard label="Cleared" value={ev.lookalikes.correctlyCleared} tone="success" />
            <StatCard label="Flagged" value={ev.lookalikes.falselyFlagged} tone="danger" />
          </div>
        </Panel>

        <Panel id="agent-heading" title="Agent behaviour" subtitle="Per-case averages and human oversight">
          <dl className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="eyebrow">Evidence / case</dt>
              <dd className="tabular mt-1 text-2xl font-semibold">{ev.avgEvidencePerCase}</dd>
            </div>
            <div>
              <dt className="eyebrow">Graph entities</dt>
              <dd className="tabular mt-1 text-2xl font-semibold">{ev.avgGraphEntities}</dd>
            </div>
            <div>
              <dt className="eyebrow">Override rate</dt>
              <dd className="tabular mt-1 text-2xl font-semibold">{formatPercent(ev.humanOverrideRate, 0)}</dd>
            </div>
          </dl>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel id="risk-dist-heading" title="Queue by risk level" subtitle="Current case queue">
          <DistributionBars
            rows={data.riskDistribution.map((r) => ({
              label: r.level.charAt(0) + r.level.slice(1).toLowerCase(),
              value: r.count,
              barClass: { LOW: 'bg-success', MEDIUM: 'bg-warning', HIGH: 'bg-brand', CRITICAL: 'bg-danger' }[r.level],
            }))}
          />
        </Panel>
        <Panel id="pattern-dist-heading" title="Queue by pattern" subtitle="Current case queue">
          <DistributionBars
            rows={data.patternDistribution.map((p) => ({
              label: p.pattern.replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase()),
              value: p.count,
            }))}
          />
        </Panel>
      </div>
    </div>
  )
}
