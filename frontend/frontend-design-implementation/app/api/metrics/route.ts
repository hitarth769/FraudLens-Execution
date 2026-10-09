import { NextResponse } from 'next/server'
import { buildMetrics } from '@/lib/fixtures/store'

export function GET() {
  return NextResponse.json(buildMetrics())
}
