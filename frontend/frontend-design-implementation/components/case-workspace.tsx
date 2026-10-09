'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Play, RotateCcw } from 'lucide-react'
import { investigateCase, useCase, useTimeline } from '@/lib/api'
import { actionsLabel, formatAmount, formatDateTime } from '@/lib/format'
import type { CaseDetail } from '@/lib/types'
import { PatternChip, RiskBadge, StatusBadge } from '@/components/badges'
import { ErrorState, Skeleton } from '@/components/state-views'
import { Button } from '@/components/ui/button'
import { EvidenceList } from '@/components/evidence-list'
import { GraphView } from '@/components/graph-view'
import { RecommendationPanel } from '@/components/recommendation-panel'
import { RiskPanel } from '@/components/risk-panel'
import { TimelineView } from '@/components/timeline-view'

const ALL_STEPS = Number.MAX_SAFE_INTEGER
const STEP_INTERVAL_MS = 650

function Card({ id, title, aside, children }: { id: string; title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id={id} className="text-base font-semibold">
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

function CaseContext({ detail }: { detail: CaseDetail }) {
  const rows: [string, string][] = [
    ['Customer', `${detail.customer.name} · ${detail.customer.customerId}`],
    ['Segment', `${detail.customer.segment} · ${detail.customer.tenure}`],
    ['Account', detail.accountId],
    ['Counterparty', detail.counterparty],
    ['Channel', detail.transaction.channel],
    ['Card', detail.transaction.card],
    ['Device', detail.transaction.deviceId],
    ['IP · Location', `${detail.transaction.ip} · ${detail.transaction.location}`],
  ]
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
      {rows.map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="eyebrow">{k}</dt>
          <dd className="mt-0.5 truncate font-mono text-sm" title={v}>
            {v}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export function CaseWorkspace({ caseId }: { caseId: string }) {
  const { data: detail, error, isLoading, mutate } = useCase(caseId)
  const { data: timeline } = useTimeline(caseId)
  const [revealStep, setRevealStep] = useState(ALL_STEPS)
  const [running, setRunning] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const totalSteps = timeline?.length ?? 0

  const stopTimer = useCallback(() => {
    if (timer.current) clearInterval(timer.current)
    timer.current = null
  }, [])

  useEffect(() => stopTimer, [stopTimer])

  async function runInvestigation() {
    stopTimer()
    setRunError(null)
    setRunning(true)
    setRevealStep(0)
    try {
      const result = await investigateCase(caseId)
      const steps = Math.max(totalSteps, ...result.evidence.map((e) => e.revealedAtStep), 1)
      let step = 0
      timer.current = setInterval(() => {
        step += 1
        setRevealStep(step)
        if (step >= steps) {
          stopTimer()
          setRevealStep(ALL_STEPS)
          setRunning(false)
        }
      }, STEP_INTERVAL_MS)
    } catch (e) {
      setRunError(e instanceof Error ? e.message : 'Investigation failed.')
      setRevealStep(ALL_STEPS)
      setRunning(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }
  if (error || !detail) {
    return <ErrorState title="Could not load case" message={error?.message} onRetry={() => mutate()} />
  }

  const evidence = detail.evidence.filter((e) => e.revealedAtStep <= revealStep)
  const showOutcome = !running

  return (
    <div className="space-y-4">
      <Link
        href="/cases"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to cases
      </Link>

      <header className="rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-mono text-xl font-semibold">{detail.caseId}</h1>
              <RiskBadge level={detail.riskLevel} />
              <StatusBadge status={detail.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {detail.scenario} · {formatDateTime(detail.timestamp)} IST
            </p>
            <p className="mt-2 flex flex-wrap items-center gap-1.5">
              {detail.patterns.map((p) => (
                <PatternChip key={p} pattern={p} />
              ))}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <div className="sm:text-right">
              <p className="tabular text-2xl font-bold leading-none">{formatAmount(detail.amount, detail.currency)}</p>
              <p className="mt-1 text-meta text-muted-foreground">
                {detail.transactionId} · Recommended: {actionsLabel(detail.recommendedActions)}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={runInvestigation} disabled={running}>
              {running ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : revealStep === ALL_STEPS && totalSteps > 0 ? (
                <RotateCcw className="size-4" aria-hidden="true" />
              ) : (
                <Play className="size-4" aria-hidden="true" />
              )}
              {running ? 'Investigating…' : 'Re-run investigation'}
            </Button>
          </div>
        </div>
        <hr className="my-4" />
        <CaseContext detail={detail} />
        {runError && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {runError}
          </p>
        )}
      </header>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0 space-y-4">
          <Card id="graph-heading" title="Relationship graph">
            <GraphView caseId={caseId} revealStep={revealStep} />
          </Card>
          <Card
            id="evidence-heading"
            title="Evidence"
            aside={<span className="tabular text-meta text-muted-foreground">{evidence.length} items</span>}
          >
            <EvidenceList items={evidence} />
          </Card>
        </div>

        <aside className="min-w-0 space-y-4" aria-label="Assessment and actions">
          {showOutcome ? (
            <>
              <RecommendationPanel detail={detail} />
              <RiskPanel detail={detail} />
            </>
          ) : (
            <div className="rounded-lg border bg-card p-4" role="status">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Loader2 className="size-4 animate-spin text-brand-dark" aria-hidden="true" />
                Agent is investigating…
              </p>
              <p className="mt-1 text-meta text-muted-foreground">
                The recommendation appears once every step has completed.
              </p>
            </div>
          )}
          <Card id="timeline-heading" title="Investigation timeline">
            <TimelineView caseId={caseId} revealStep={revealStep} />
          </Card>
        </aside>
      </div>
    </div>
  )
}
