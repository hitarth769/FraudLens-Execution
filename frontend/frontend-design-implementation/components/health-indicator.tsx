'use client'

import { useHealth } from '@/lib/api'
import { cn } from '@/lib/utils'

export function HealthIndicator() {
  const { data, error, isLoading } = useHealth()

  const state = isLoading ? 'checking' : error || !data ? 'offline' : data.status === 'ok' ? 'ok' : 'degraded'
  const label =
    state === 'checking'
      ? 'Checking'
      : state === 'offline'
        ? 'API offline'
        : `${data?.mode === 'live' ? 'Live' : 'Fixture'} data${data?.llm === 'unavailable' ? ' · template narrative' : ''}`

  return (
    <div
      role="status"
      className="flex items-center gap-2 rounded-md border bg-background px-2.5 py-1 text-meta text-muted-foreground"
    >
      <span
        aria-hidden="true"
        className={cn(
          'size-1.5 rounded-full',
          state === 'ok' && 'bg-success',
          state === 'degraded' && 'bg-warning',
          state === 'offline' && 'bg-danger',
          state === 'checking' && 'bg-muted-foreground/50',
        )}
      />
      <span>{label}</span>
    </div>
  )
}
