'use client'

import useSWR, { mutate } from 'swr'
import type {
  CaseDetail,
  CaseGraph,
  CaseSummary,
  DecisionRequest,
  Health,
  Metrics,
  TimelineStep,
} from './types'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ''
  const fullUrl = baseUrl.endsWith('/') ? `${baseUrl}${url.slice(1)}` : `${baseUrl}${url}`

  let res: Response
  try {
    res = await fetch(fullUrl, init)
  } catch {
    throw new ApiError('Could not reach the FraudLens API.', 0)
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(body?.error ?? `Request failed (${res.status})`, res.status)
  }
  return res.json() as Promise<T>
}

const fetcher = <T,>(url: string) => request<T>(url)

export function useHealth() {
  return useSWR<Health, ApiError>('/api/health', fetcher, { refreshInterval: 30000, shouldRetryOnError: false })
}

export function useCases() {
  return useSWR<CaseSummary[], ApiError>('/api/cases', fetcher)
}

export function useCase(id: string) {
  return useSWR<CaseDetail, ApiError>(`/api/cases/${id}`, fetcher)
}

export function useTimeline(id: string) {
  return useSWR<TimelineStep[], ApiError>(`/api/cases/${id}/timeline`, fetcher)
}

export function useGraph(id: string) {
  return useSWR<CaseGraph, ApiError>(`/api/cases/${id}/graph`, fetcher)
}

export function useMetrics() {
  return useSWR<Metrics, ApiError>('/api/metrics', fetcher)
}

async function refreshCaseData(id: string, detail: CaseDetail) {
  await Promise.all([
    mutate(`/api/cases/${id}`, detail, { revalidate: false }),
    mutate(`/api/cases/${id}/timeline`),
    mutate(`/api/cases/${id}/graph`),
    mutate('/api/cases'),
    mutate('/api/metrics'),
  ])
}

export async function investigateCase(id: string) {
  const detail = await request<CaseDetail>(`/api/cases/${id}/investigate`, { method: 'POST' })
  await refreshCaseData(id, detail)
  return detail
}

export async function submitDecision(id: string, body: DecisionRequest) {
  const detail = await request<CaseDetail>(`/api/cases/${id}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  await refreshCaseData(id, detail)
  return detail
}
