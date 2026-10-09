'use client'

import { useId, useState } from 'react'
import { CheckCircle2, Loader2, ShieldCheck, Sparkles, FileText } from 'lucide-react'
import { submitDecision } from '@/lib/api'
import { ACTION_LABEL, actionsLabel, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { CaseDetail, RecommendedAction } from '@/lib/types'
import { ActionBadge } from '@/components/badges'
import { Button } from '@/components/ui/button'

const ACTIONS: RecommendedAction[] = ['APPROVE', 'HOLD', 'ESCALATE', 'BLOCK']

function DecisionRecord({ detail }: { detail: CaseDetail }) {
  const d = detail.humanDecision
  if (!d) return null
  const overridden = d.decision === 'OVERRIDE'
  return (
    <div
      role="status"
      className={cn(
        'rounded-md border p-3',
        overridden ? 'border-info/30 bg-info-soft' : 'border-success/30 bg-success-soft',
      )}
    >
      <p className="flex items-center gap-2 text-sm font-semibold">
        <CheckCircle2 className={cn('size-4', overridden ? 'text-info' : 'text-success')} aria-hidden="true" />
        {overridden
          ? `Overridden to ${d.overrideAction ? ACTION_LABEL[d.overrideAction] : 'custom action'}`
          : 'Recommendation approved'}
      </p>
      <p className="mt-1 text-meta text-muted-foreground">
        {d.analyst} · {formatDateTime(d.decidedAt)}
      </p>
      {d.note && <p className="mt-2 text-sm">&ldquo;{d.note}&rdquo;</p>}
    </div>
  )
}

export function RecommendationPanel({ detail }: { detail: CaseDetail }) {
  const { recommendation: rec } = detail
  const [mode, setMode] = useState<'idle' | 'override'>('idle')
  const [overrideAction, setOverrideAction] = useState<RecommendedAction | null>(null)
  const [note, setNote] = useState('')
  const [pending, setPending] = useState<'APPROVE' | 'OVERRIDE' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const noteId = useId()
  const decided = detail.status !== 'AWAITING_DECISION'

  async function decide(decision: 'APPROVE' | 'OVERRIDE') {
    setError(null)
    setPending(decision)
    try {
      await submitDecision(detail.caseId, {
        decision,
        overrideAction: decision === 'OVERRIDE' ? (overrideAction ?? undefined) : undefined,
        note: note.trim() || undefined,
      })
      setMode('idle')
      setNote('')
      setOverrideAction(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not record the decision.')
    } finally {
      setPending(null)
    }
  }

  const canSubmitOverride = overrideAction !== null && note.trim().length > 0

  return (
    <section aria-labelledby="rec-heading" className="rounded-lg border-2 border-brand/50 bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 id="rec-heading" className="text-base font-semibold">
          Recommendation
        </h2>
        <span className="inline-flex items-center gap-1 text-meta text-muted-foreground">
          {rec.narrativeSource === 'LLM' ? (
            <Sparkles className="size-3.5" aria-hidden="true" />
          ) : (
            <FileText className="size-3.5" aria-hidden="true" />
          )}
          {rec.narrativeSource === 'LLM' ? 'AI narrative' : 'Template narrative'}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {rec.actions.map((a) => (
          <ActionBadge key={a} action={a} />
        ))}
        <span className="text-sm font-semibold">{actionsLabel(rec.actions)}</span>
      </div>

      <p className="mt-3 text-sm leading-relaxed">{rec.summary}</p>

      <h3 className="eyebrow mt-4">Rationale</h3>
      <ol className="mt-2 space-y-2">
        {rec.rationale.map((r, i) => (
          <li key={i} className="flex gap-2 text-sm">
            <span className="tabular mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold">
              {i + 1}
            </span>
            <div>
              <p>{r.text}</p>
              {r.evidenceIds.length > 0 && (
                <p className="mt-0.5 flex flex-wrap gap-1.5">
                  {r.evidenceIds.map((id) => (
                    <a
                      key={id}
                      href={`#${id}`}
                      className="rounded border bg-secondary px-1.5 font-mono text-[11px] text-brand-dark hover:underline"
                    >
                      {id}
                    </a>
                  ))}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-5 border-t pt-4">
        {decided ? (
          <DecisionRecord detail={detail} />
        ) : (
          <>
            {rec.humanApprovalRequired && (
              <p className="mb-3 flex items-start gap-2 text-meta text-muted-foreground">
                <ShieldCheck className="mt-px size-4 shrink-0 text-brand-dark" aria-hidden="true" />
                Human approval required. The agent recommends; an analyst decides.
              </p>
            )}

            {mode === 'idle' ? (
              <div className="flex flex-col gap-2 sm:flex-row xl:flex-col 2xl:flex-row">
                <Button
                  className="flex-1 bg-brand-dark text-white hover:bg-brand-dark/90"
                  disabled={pending !== null}
                  onClick={() => decide('APPROVE')}
                >
                  {pending === 'APPROVE' && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                  Approve recommendation
                </Button>
                <Button variant="outline" className="flex-1" disabled={pending !== null} onClick={() => setMode('override')}>
                  Override
                </Button>
              </div>
            ) : (
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (canSubmitOverride) decide('OVERRIDE')
                }}
              >
                <fieldset>
                  <legend className="text-sm font-medium">Override action</legend>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {ACTIONS.map((a) => (
                      <label
                        key={a}
                        className={cn(
                          'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring',
                          overrideAction === a ? 'border-brand bg-brand-soft font-medium' : 'hover:bg-accent',
                        )}
                      >
                        <input
                          type="radio"
                          name="override-action"
                          value={a}
                          checked={overrideAction === a}
                          onChange={() => setOverrideAction(a)}
                          className="accent-[var(--brand)]"
                        />
                        {ACTION_LABEL[a]}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div>
                  <label htmlFor={noteId} className="text-sm font-medium">
                    Reason for override
                  </label>
                  <textarea
                    id={noteId}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    required
                    placeholder="Recorded in the audit trail"
                    className="mt-1 w-full resize-none rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={!canSubmitOverride || pending !== null}>
                    {pending === 'OVERRIDE' && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                    Confirm override
                  </Button>
                  <Button type="button" variant="ghost" disabled={pending !== null} onClick={() => setMode('idle')}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}
            {error && (
              <p role="alert" className="mt-3 text-sm text-danger">
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  )
}
