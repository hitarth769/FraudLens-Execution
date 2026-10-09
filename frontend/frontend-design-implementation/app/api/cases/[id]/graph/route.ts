import { NextResponse } from 'next/server'
import { GRAPHS } from '@/lib/fixtures/graphs'

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const graph = GRAPHS[id]
  if (!graph) return NextResponse.json({ error: `Case ${id} not found` }, { status: 404 })
  return NextResponse.json(graph)
}
