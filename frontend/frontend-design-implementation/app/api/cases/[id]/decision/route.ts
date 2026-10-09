import { NextResponse } from 'next/server'
import { recordDecision } from '@/lib/fixtures/store'
import type { DecisionRequest } from '@/lib/types'

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const body = (await req.json().catch(() => null)) as DecisionRequest | null
  if (!body || (body.decision !== 'APPROVE' && body.decision !== 'OVERRIDE')) {
    return NextResponse.json({ error: 'decision must be APPROVE or OVERRIDE' }, { status: 400 })
  }
  if (body.decision === 'OVERRIDE' && !body.overrideAction) {
    return NextResponse.json({ error: 'overrideAction is required for OVERRIDE' }, { status: 400 })
  }
  const updated = recordDecision(id, body)
  if (!updated) return NextResponse.json({ error: `Case ${id} not found` }, { status: 404 })
  return NextResponse.json(updated)
}
