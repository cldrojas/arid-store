'use client'

import { Slot } from '@radix-ui/react-slot'
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
  children: ReactNode
  className?: string
} & ButtonHTMLAttributes<HTMLButtonElement>

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-accent-content hover:bg-accent-hover hover:scale-[1.02] active:scale-[0.98] active:opacity-80 disabled:opacity-50',
  secondary:
    'bg-surface-tertiary text-content hover:bg-surface-secondary active:bg-edge-strong disabled:opacity-50',
  outline:
    'border border-edge-strong text-content hover:bg-surface-secondary active:bg-surface-tertiary disabled:opacity-50',
  ghost:
    'text-content-secondary hover:text-content hover:bg-surface-tertiary active:bg-surface-secondary disabled:opacity-50'
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      asChild = false,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-edge-focus focus-visible:ring-offset-2 disabled:pointer-events-none cursor-pointer'

    const classes = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`

    if (asChild) {
      return (
        <Slot ref={ref} className={classes} {...props}>
          {children}
        </Slot>
      )
    }

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    )
  }
)
