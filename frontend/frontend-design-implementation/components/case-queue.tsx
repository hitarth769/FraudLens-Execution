'use client'

import { useCases } from '@/lib/api'
import { CaseTable } from '@/components/case-table'
import { EmptyState, ErrorState, Skeleton } from '@/components/state-views'

export function CaseQueue({ limit }: { limit?: number }) {
  const { data, error, isLoading, mutate } = useCases()

  if (isLoading) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Loading cases">
        {Array.from({ length: limit ?? 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    )
  }
  if (error) return <ErrorState title="Could not load cases" message={error.message} onRetry={() => mutate()} />
  if (!data || data.length === 0) {
    return <EmptyState title="No cases yet" message="Flagged transactions will appear here for investigation." />
  }

  const sorted = [...data].sort((a, b) => b.riskScore - a.riskScore)
  return <CaseTable cases={limit ? sorted.slice(0, limit) : sorted} />
}
