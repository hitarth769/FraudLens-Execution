import type { Metadata } from 'next'
import { CaseQueue } from '@/components/case-queue'

export const metadata: Metadata = { title: 'Cases — FraudLens' }

export default function CasesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-bold leading-tight tracking-tight">Case queue</h1>
        <p className="mt-1 text-muted-foreground">Ordered by risk score. Open a case to review evidence and decide.</p>
      </div>
      <CaseQueue />
    </div>
  )
}
