import type { ReactNode } from 'react'

type StatsCardProps = {
  icon: ReactNode
  title: string
  value: string | number
  description?: string
}

export function StatsCard({ icon, title, value, description }: StatsCardProps) {
  return (
    <div className="rounded-xl border border-edge bg-surface p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-content-muted">{title}</p>
          <p className="text-2xl font-bold text-content">{value}</p>
          {description && (
            <p className="text-xs text-content-muted">{description}</p>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-tertiary text-content-secondary">
          {icon}
        </div>
      </div>
    </div>
  )
}
