import { cn } from '@/lib/utils'

export interface BarRow {
  label: string
  value: number
  barClass?: string
}

export function DistributionBars({ rows, unit = 'cases' }: { rows: BarRow[]; unit?: string }) {
  const max = Math.max(...rows.map((r) => r.value), 1)
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.label} className="grid grid-cols-[120px_1fr_auto] items-center gap-3 text-sm">
          <span className="truncate text-muted-foreground">{row.label}</span>
          <div
            role="img"
            aria-label={`${row.label}: ${row.value} ${unit}`}
            className="h-2 overflow-hidden rounded-full bg-muted"
          >
            <div
              className={cn('h-full rounded-full transition-[width] duration-500', row.barClass ?? 'bg-brand')}
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </div>
          <span className="tabular w-6 text-right font-semibold">{row.value}</span>
        </li>
      ))}
    </ul>
  )
}
