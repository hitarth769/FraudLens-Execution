'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useMetrics } from '@/lib/api'
import { PATTERN_LABEL, RISK_STYLE, formatDuration } from '@/lib/format'
import { CaseQueue } from '@/components/case-queue'
import { DistributionBars } from '@/components/distribution-bars'
import { ErrorState, Skeleton } from '@/components/state-views'
import { StatCard } from '@/components/stat-card'

export function CommandCenter() {
  const { data, error, isLoading, mutate } = useMetrics()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-bold leading-tight tracking-tight text-balance">Command center</h1>
        <p className="mt-1 text-muted-foreground">Flagged transactions awaiting investigation and analyst decision.</p>
      </div>

      {error ? (
        <ErrorState title="Could not load metrics" message={error.message} onRetry={() => mutate()} />
      ) : (
        <section aria-label="Overview" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {isLoading || !data ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[108px]" />)
          ) : (
            <>
              <StatCard
                label="Cases pending"
                value={data.overview?.casesPending ?? '—'}
                hint={data.overview?.deltas?.casesPending ?? 'Unavailable'}
                tone="brand"
              />
              <StatCard
                label="Fraud detected"
                value={data.overview?.fraudDetected ?? '—'}
                hint={data.overview?.deltas?.fraudDetected ?? 'Unavailable'}
                tone="danger"
              />
              <StatCard
                label="False alarms"
                value={data.overview?.falseAlarms ?? '—'}
                hint={data.overview?.deltas?.falseAlarms ?? 'Unavailable'}
                tone="success"
              />
              <StatCard
                label="Avg investigation time"
                value={data.overview?.avgInvestigationSec ? formatDuration(data.overview.avgInvestigationSec) : '—'}
                hint={data.overview?.deltas?.avgInvestigationSec ?? 'Unavailable'}
              />
            </>
          )}
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <section aria-labelledby="recent-heading" className="min-w-0 space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="recent-heading" className="text-xl font-semibold tracking-tight">
              Recent cases
            </h2>
            <Link
              href="/cases"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-dark hover:underline"
            >
              View all <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
          <CaseQueue limit={6} />
        </section>

        <div className="space-y-6">
          <section aria-labelledby="risk-heading" className="rounded-lg border bg-card p-4">
            <h2 id="risk-heading" className="mb-4 text-base font-semibold">
              Risk distribution
            </h2>
            {data ? (
              <DistributionBars
                rows={data.riskDistribution?.map((r) => ({
                  label: RISK_STYLE[r.level].label,
                  value: r.count,
                  barClass: RISK_STYLE[r.level].bar,
                })) ?? []}
              />
            ) : (
              <Skeleton className="h-28" />
            )}
          </section>
          <section aria-labelledby="pattern-heading" className="rounded-lg border bg-card p-4">
            <h2 id="pattern-heading" className="mb-4 text-base font-semibold">
              Pattern distribution
            </h2>
            {data ? (
              <DistributionBars
                rows={data.patternDistribution?.map((p) => ({ label: PATTERN_LABEL[p.pattern], value: p.count })) ?? []}
              />
            ) : (
              <Skeleton className="h-28" />
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
