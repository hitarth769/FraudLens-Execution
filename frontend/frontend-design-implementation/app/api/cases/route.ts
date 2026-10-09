import { NextResponse } from 'next/server'
import { listCases } from '@/lib/fixtures/store'

export function GET() {
  return NextResponse.json(listCases())
}
