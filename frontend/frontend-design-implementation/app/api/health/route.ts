import { NextResponse } from 'next/server'

const BACKEND_URL = 'http://127.0.0.1:8001/api'

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/health`)
    if (!response.ok) throw new Error('Backend unhealthy')
    return NextResponse.json({ status: 'ok', backend: 'connected' })
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Backend unreachable' }, { status: 503 })
  }
}
