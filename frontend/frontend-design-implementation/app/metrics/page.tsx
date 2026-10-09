import type { Metadata } from 'next'
import { MetricsView } from '@/components/metrics-view'

export const metadata: Metadata = { title: 'Metrics — FraudLens' }

export default function MetricsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-bold leading-tight tracking-tight">Evaluation metrics</h1>
        <p className="mt-1 text-muted-foreground">How well the agent separates fraud from legitimate look-alikes.</p>
      </div>
      <MetricsView />
    </div>
  )
}
