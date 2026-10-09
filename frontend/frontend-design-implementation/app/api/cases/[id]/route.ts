import { NextResponse } from 'next/server'
import { getCase } from '@/lib/fixtures/store'

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const found = getCase(id)
  if (!found) return NextResponse.json({ error: `Case ${id} not found` }, { status: 404 })
  return NextResponse.json(found)
}
