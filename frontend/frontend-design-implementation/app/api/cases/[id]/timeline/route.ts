import { NextResponse } from 'next/server'
import { TIMELINES } from '@/lib/fixtures/timelines'

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const steps = TIMELINES[id]
  if (!steps) return NextResponse.json({ error: `Case ${id} not found` }, { status: 404 })
  return NextResponse.json(steps)
}
