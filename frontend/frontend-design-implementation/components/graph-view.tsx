'use client'

import { useMemo, useState } from 'react'
import { CreditCard, Fingerprint, Globe, Landmark, Receipt, Smartphone, Store, User } from 'lucide-react'
import { useGraph } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { GraphEdge, GraphNode, GraphNodeType } from '@/lib/types'
import { EmptyState, ErrorState, Skeleton } from '@/components/state-views'

const NODE_W = 132
const NODE_H = 46
const COL_W = 178
const ROW_H = 64
const PAD = 12

const ICONS: Record<GraphNodeType, typeof User> = {
  customer: User,
  account: Landmark,
  device: Smartphone,
  card: CreditCard,
  merchant: Store,
  transaction: Receipt,
  ip: Globe,
}

const TYPE_LABEL: Record<GraphNodeType, string> = {
  customer: 'Customer',
  account: 'Account',
  device: 'Device',
  card: 'Card',
  merchant: 'Merchant',
  transaction: 'Transaction',
  ip: 'IP address',
}

const EDGE_LABEL: Record<GraphEdge['kind'], string> = {
  owns: 'owns',
  uses: 'uses',
  paid: 'paid',
  transferred: 'transferred',
  logged_in: 'logged in',
}

interface Placed {
  node: GraphNode
  x: number
  y: number
}

function layout(nodes: GraphNode[]) {
  const layers = new Map<number, GraphNode[]>()
  for (const n of nodes) layers.set(n.layer, [...(layers.get(n.layer) ?? []), n])
  const maxLayer = Math.max(...layers.keys(), 0)
  const maxRows = Math.max(...[...layers.values()].map((l) => l.length), 1)
  const height = maxRows * ROW_H + PAD * 2
  const width = (maxLayer + 1) * COL_W - (COL_W - NODE_W) + PAD * 2
  const placed = new Map<string, Placed>()
  for (const [layer, list] of layers) {
    const offset = ((maxRows - list.length) * ROW_H) / 2
    list.forEach((node, i) => {
      placed.set(node.id, {
        node,
        x: PAD + layer * COL_W,
        y: PAD + offset + i * ROW_H + (ROW_H - NODE_H) / 2,
      })
    })
  }
  return { placed, width, height }
}

function edgePath(a: Placed, b: Placed) {
  if (a.node.layer === b.node.layer) {
    const x = a.x + NODE_W / 2
    const down = b.y > a.y
    const y1 = down ? a.y + NODE_H : a.y
    const y2 = down ? b.y : b.y + NODE_H
    return { d: `M${x},${y1} L${x},${y2}`, mx: x, my: (y1 + y2) / 2 }
  }
  const forward = b.node.layer > a.node.layer
  const x1 = forward ? a.x + NODE_W : a.x
  const x2 = forward ? b.x : b.x + NODE_W
  const y1 = a.y + NODE_H / 2
  const y2 = b.y + NODE_H / 2
  const c = (x2 - x1) / 2
  return { d: `M${x1},${y1} C${x1 + c},${y1} ${x2 - c},${y2} ${x2},${y2}`, mx: (x1 + x2) / 2, my: (y1 + y2) / 2 }
}

export function GraphView({ caseId, revealStep }: { caseId: string; revealStep: number }) {
  const { data, error, isLoading, mutate } = useGraph(caseId)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const geometry = useMemo(() => (data ? layout(data.nodes) : null), [data])

  if (isLoading) return <Skeleton className="h-64 w-full" />
  if (error) return <ErrorState title="Could not load relationship graph" message={error.message} onRetry={() => mutate()} />
  if (!data || !geometry || data.nodes.length === 0) {
    return <EmptyState title="No relationships mapped" message="Run an investigation to build the entity graph." />
  }

  const visibleNodes = data.nodes.filter((n) => n.revealedAtStep <= revealStep)
  const visibleIds = new Set(visibleNodes.map((n) => n.id))
  const visibleEdges = data.edges.filter(
    (e) => e.revealedAtStep <= revealStep && visibleIds.has(e.source) && visibleIds.has(e.target),
  )
  const selected = visibleNodes.find((n) => n.id === selectedId) ?? null

  return (
    <div>
      <div className="overflow-x-auto">
        <svg
          role="group"
          aria-label="Entity relationship graph"
          viewBox={`0 0 ${geometry.width} ${geometry.height}`}
          style={{ minWidth: Math.min(geometry.width, 640), maxWidth: geometry.width * 1.15 }}
          className="mx-auto block h-auto w-full"
        >
          <defs>
            <marker id="arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L8,4 L0,8 z" fill="#a8a29e" />
            </marker>
            <marker id="arrow-hot" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L8,4 L0,8 z" fill="#ea580c" />
            </marker>
          </defs>

          {visibleEdges.map((e) => {
            const a = geometry.placed.get(e.source)
            const b = geometry.placed.get(e.target)
            if (!a || !b) return null
            const { d, mx, my } = edgePath(a, b)
            const text = e.label ?? EDGE_LABEL[e.kind]
            return (
              <g key={e.id} className="animate-node-in">
                <path
                  d={d}
                  fill="none"
                  stroke={e.suspicious ? '#ea580c' : '#d6d3d1'}
                  strokeWidth={e.suspicious ? 1.75 : 1.25}
                  strokeDasharray={e.kind === 'logged_in' ? '4 3' : undefined}
                  markerEnd={`url(#${e.suspicious ? 'arrow-hot' : 'arrow'})`}
                />
                <text
                  x={mx}
                  y={my - 4}
                  textAnchor="middle"
                  className="fill-muted-foreground"
                  style={{ fontSize: 10, paintOrder: 'stroke', stroke: '#fff', strokeWidth: 3 }}
                >
                  {text}
                </text>
              </g>
            )
          })}

          {visibleNodes.map((n) => {
            const p = geometry.placed.get(n.id)
            if (!p) return null
            const Icon = ICONS[n.type]
            const isSelected = n.id === selectedId
            return (
              <g
                key={n.id}
                transform={`translate(${p.x},${p.y})`}
                className="animate-node-in cursor-pointer outline-none [&:focus-visible>rect]:stroke-[#f97316] [&:focus-visible>rect]:stroke-2"
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={`${TYPE_LABEL[n.type]} ${n.label}, ${n.sublabel}${n.suspicious ? ', suspicious' : ''}`}
                onClick={() => setSelectedId(isSelected ? null : n.id)}
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault()
                    setSelectedId(isSelected ? null : n.id)
                  }
                }}
              >
                <rect
                  width={NODE_W}
                  height={NODE_H}
                  rx={6}
                  fill={n.suspicious ? '#fdecec' : '#ffffff'}
                  stroke={isSelected ? '#f97316' : n.suspicious ? '#f5b5b5' : '#d6d3d1'}
                  strokeWidth={isSelected ? 2.5 : 1.25}
                />
                <foreignObject x={8} y={0} width={NODE_W - 12} height={NODE_H}>
                  <div className="flex h-full items-center gap-2">
                    <Icon
                      className={cn('size-4 shrink-0', n.suspicious ? 'text-danger' : 'text-muted-foreground')}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 leading-tight">
                      <p className="truncate font-mono text-[11.5px] font-semibold">{n.label}</p>
                      <p className="truncate text-[10.5px] text-muted-foreground">{n.sublabel}</p>
                    </div>
                  </div>
                </foreignObject>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-meta text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-0.5 w-4 bg-orange-600" /> Suspicious link
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-0.5 w-4 bg-stone-300" /> Normal link
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Fingerprint className="size-3.5" aria-hidden="true" /> Select a node for attributes
        </span>
      </div>

      {selected && (
        <div className="mt-3 rounded-md border border-brand/40 bg-brand-soft/60 p-3" aria-live="polite">
          <p className="eyebrow">{TYPE_LABEL[selected.type]}</p>
          <p className="mt-0.5 font-mono text-sm font-semibold">
            {selected.label}
            {selected.suspicious && <span className="ml-2 text-meta font-sans text-danger">Flagged suspicious</span>}
          </p>
          {Object.keys(selected.attributes).length > 0 && (
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
              {Object.entries(selected.attributes).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-meta text-muted-foreground">{k}</dt>
                  <dd className="tabular font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </div>
  )
}
