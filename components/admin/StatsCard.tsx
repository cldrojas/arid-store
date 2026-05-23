import type { ReactNode } from 'react'

type StatsCardProps = {
  icon: ReactNode
  title: string
  value: string | number
  description?: string
}

export function StatsCard({ icon, title, value, description }: StatsCardProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-neutral-500">{title}</p>
          <p className="text-2xl font-bold text-neutral-900">{value}</p>
          {description && (
            <p className="text-xs text-neutral-400">{description}</p>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
          {icon}
        </div>
      </div>
    </div>
  )
}
