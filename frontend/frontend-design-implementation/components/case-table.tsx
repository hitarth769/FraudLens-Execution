'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { PatternChip, RiskBadge, StatusBadge } from '@/components/badges'
import { formatAmount, formatDateTime } from '@/lib/format'
import type { CaseSummary } from '@/lib/types'

export function CaseTable({ cases }: { cases: CaseSummary[] }) {
  const router = useRouter()

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full min-w-[900px] text-left text-sm">
        <caption className="sr-only">Fraud cases ordered by risk score</caption>
        <thead>
          <tr className="border-b bg-muted/50">
            {['Case', 'Transaction', 'Amount', 'Risk', 'Patterns', 'Status', 'Time'].map((h) => (
              <th key={h} scope="col" className="eyebrow px-4 py-2.5 font-semibold">
                {h}
              </th>
            ))}
            <th scope="col" className="w-8 px-2">
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => (
            <tr
              key={c.caseId}
              onClick={() => router.push(`/cases/${c.caseId}`)}
              className="cursor-pointer border-b last:border-b-0 transition-colors hover:bg-accent/60"
            >
              <td className="whitespace-nowrap px-4 py-3">
                <Link
                  href={`/cases/${c.caseId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="font-mono text-[13px] font-semibold hover:text-brand-dark focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {c.caseId}
                </Link>
                <p className="mt-0.5 text-meta text-muted-foreground">{c.customerName}</p>
              </td>
              <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">{c.transactionId}</td>
              <td className="tabular px-4 py-3 font-semibold">{formatAmount(c.amount, c.currency)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <RiskBadge level={c.riskLevel} />
                  <span className="tabular text-meta text-muted-foreground">{c.riskScore}/100</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {c.patterns.length === 0 ? (
                    <span className="text-meta text-muted-foreground">None</span>
                  ) : (
                    c.patterns.map((p) => <PatternChip key={p} pattern={p} />)
                  )}
                </div>
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <StatusBadge status={c.status} />
              </td>
              <td className="tabular whitespace-nowrap px-4 py-3 text-meta text-muted-foreground">
                {formatDateTime(c.timestamp)}
              </td>
              <td className="px-2 text-muted-foreground">
                <ChevronRight className="size-4" aria-hidden="true" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
