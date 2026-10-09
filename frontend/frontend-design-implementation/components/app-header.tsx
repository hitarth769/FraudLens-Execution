'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, FolderSearch, LayoutDashboard, ScanSearch } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HealthIndicator } from '@/components/health-indicator'

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, match: (p: string) => p === '/' },
  { href: '/cases', label: 'Cases', icon: FolderSearch, match: (p: string) => p.startsWith('/cases') },
  { href: '/metrics', label: 'Metrics', icon: BarChart3, match: (p: string) => p.startsWith('/metrics') },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
        <div className="flex h-14 items-center gap-4 px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex size-7 items-center justify-center rounded-md bg-brand text-foreground">
              <ScanSearch className="size-4" aria-hidden="true" />
            </span>
            <span className="text-[15px]">FraudLens</span>
          </Link>
          <span className="hidden text-meta text-muted-foreground sm:inline">Fraud investigation workspace</span>
          <div className="ml-auto">
            <HealthIndicator />
          </div>
        </div>
        <nav aria-label="Primary" className="flex gap-1 border-t px-3 md:hidden">
          {NAV.map((item) => {
            const active = item.match(pathname)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative px-3 py-2 text-sm font-medium text-muted-foreground',
                  active && 'text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-brand',
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </header>

      <div className="flex">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 border-r bg-sidebar md:block md:w-14 lg:w-52">
          <nav aria-label="Primary" className="flex flex-col gap-1 p-2">
            {NAV.map((item) => {
              const active = item.match(pathname)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  title={item.label}
                  className={cn(
                    'relative flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:justify-center lg:justify-start',
                    active && 'bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  {active && <span aria-hidden="true" className="absolute inset-y-1.5 -left-2 w-0.5 rounded-full bg-brand" />}
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span className="md:sr-only lg:not-sr-only">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </aside>
        <main id="main" className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
