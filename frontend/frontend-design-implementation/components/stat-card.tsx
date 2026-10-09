import { cn } from '@/lib/utils'

export function StatCard({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string
  value: string | number
  hint?: string
  tone?: 'default' | 'danger' | 'success' | 'brand'
}) {
  const bar = { default: 'bg-border', danger: 'bg-danger', success: 'bg-success', brand: 'bg-brand' }[tone]
  return (
    <div className="relative overflow-hidden rounded-lg border bg-card p-4">
      <span aria-hidden="true" className={cn('absolute inset-y-0 left-0 w-1', bar)} />
      <p className="eyebrow">{label}</p>
      <p className="tabular mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-meta text-muted-foreground">{hint}</p>}
    </div>
  )
}
