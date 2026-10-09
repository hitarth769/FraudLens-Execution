import { PATTERN_LABEL, RISK_STYLE } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { CaseDetail } from '@/lib/types'
import { RiskBadge } from '@/components/badges'

function ScoreRing({ score, stroke }: { score: number; stroke: string }) {
  const r = 34
  const c = 2 * Math.PI * r
  return (
    <div className="relative size-[88px] shrink-0">
      <svg viewBox="0 0 88 88" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="44" cy="44" r={r} fill="none" stroke="var(--muted)" strokeWidth="8" />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * score) / 100}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tabular text-2xl font-bold leading-none">{score}</span>
        <span className="mt-0.5 text-[10px] text-muted-foreground">/ 100</span>
      </div>
    </div>
  )
}

const CONFIDENCE_STYLE = {
  LOW: 'text-muted-foreground',
  MEDIUM: 'text-warning',
  HIGH: 'text-danger',
} as const

export function RiskPanel({ detail }: { detail: CaseDetail }) {
  const style = RISK_STYLE[detail.riskLevel]
  const totalPoints = detail.riskFactors.reduce((sum, f) => sum + f.points, 0)

  return (
    <section aria-labelledby="risk-panel-heading" className="rounded-lg border bg-card p-4">
      <h2 id="risk-panel-heading" className="text-base font-semibold">
        Risk assessment
      </h2>

      <div className="mt-4 flex items-center gap-4">
        <ScoreRing score={detail.riskScore} stroke={style.stroke} />
        <div className="space-y-1.5">
          <RiskBadge level={detail.riskLevel} />
          <p className="text-meta text-muted-foreground">
            Composite score from {detail.riskFactors.length} weighted factors across {detail.patternScores.length}{' '}
            fraud patterns.
          </p>
        </div>
      </div>

      <div className="mt-5">
        <h3 className="eyebrow">Pattern scores</h3>
        <ul className="mt-2 space-y-3">
          {detail.patternScores.map((p) => (
            <li key={p.pattern}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium">{PATTERN_LABEL[p.pattern]}</span>
                <span className="tabular font-semibold">{p.score}</span>
              </div>
              <div
                role="img"
                aria-label={`${PATTERN_LABEL[p.pattern]} score ${p.score} out of 100`}
                className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"
              >
                <div
                  className={cn('h-full rounded-full', p.score >= 60 ? 'bg-danger' : p.score >= 30 ? 'bg-warning' : 'bg-success')}
                  style={{ width: `${p.score}%` }}
                />
              </div>
              <p className="mt-1 text-meta text-muted-foreground">
                <span className={cn('font-medium', CONFIDENCE_STYLE[p.confidence])}>{p.confidence} confidence</span> ·{' '}
                {p.supporting} supporting · {p.contradicting} contradicting
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5">
        <h3 className="eyebrow">Contributing factors</h3>
        <ul className="mt-2 divide-y rounded-md border">
          {detail.riskFactors.map((f) => (
            <li key={f.label} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate">{f.label}</p>
                <p className="text-meta text-muted-foreground">{f.channel}</p>
              </div>
              <span className={cn('tabular shrink-0 font-semibold', f.points < 0 ? 'text-success' : 'text-danger')}>
                {f.points > 0 ? '+' : ''}
                {f.points}
              </span>
            </li>
          ))}
          <li className="flex items-center justify-between bg-muted/50 px-3 py-2 text-sm font-semibold">
            <span>Net contribution</span>
            <span className="tabular">{totalPoints > 0 ? '+' : ''}{totalPoints}</span>
          </li>
        </ul>
      </div>
    </section>
  )
}
