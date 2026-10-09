import type { Metadata } from 'next'
import { CaseWorkspace } from '@/components/case-workspace'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  return { title: `${id} — FraudLens` }
}

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CaseWorkspace caseId={id} />
}
