import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error'

type BadgeProps = {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default:
    'bg-surface-tertiary text-content-secondary dark:bg-neutral-800 dark:text-neutral-300',
  success:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  warning:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  error:
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
}

export function Badge({
  variant = 'default',
  children,
  className = ''
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
