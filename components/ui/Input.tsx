'use client'

import { forwardRef, type InputHTMLAttributes } from 'react'

type InputProps = {
  label?: string
  error?: string
} & InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, className = '', id, ...props }, ref) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-content-tertiary"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`rounded-lg border border-edge-strong px-3 py-2 text-sm text-content placeholder-content-muted transition-colors focus:border-edge-focus focus:outline-none focus:ring-2 focus:ring-edge-focus focus:ring-offset-0 disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:text-content-muted ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-400' : ''} ${className}`}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    )
  }
)
