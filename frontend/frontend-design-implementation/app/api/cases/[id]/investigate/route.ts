import { NextResponse } from 'next/server'
import { getCase } from '@/lib/fixtures/store'

const BACKEND_URL = 'http://127.0.0.1:8001/api'

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params

  try {
    const response = await fetch(`${BACKEND_URL}/cases/${id}/investigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: `Backend error: ${errorText}` }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Investigation proxy error:', error)
    return NextResponse.json({ error: 'Failed to connect to backend' }, { status: 500 })
  }
}
