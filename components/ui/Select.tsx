'use client'

import * as RadixSelect from '@radix-ui/react-select'
import { forwardRef, type ReactNode } from 'react'

type SelectItem = {
  value: string
  label: string
}

type SelectProps = {
  label?: string
  placeholder?: string
  items: SelectItem[]
  value?: string
  onValueChange?: (value: string) => void
  error?: string
  disabled?: boolean
  className?: string
}

export function Select({
  label,
  placeholder = 'Seleccionar...',
  items,
  value,
  onValueChange,
  error,
  disabled,
  className = ''
}: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}
      <RadixSelect.Root
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <RadixSelect.Trigger
          className={`inline-flex items-center justify-between gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 transition-colors focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-400' : ''} ${className}`}
        >
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-neutral-400"
            >
              <path
                d="M3 4.5L6 7.5L9 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            position="popper"
            className="z-50 mt-1 max-h-60 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg"
          >
            <RadixSelect.Viewport className="p-1">
              {items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}

const SelectItem = forwardRef<
  React.ComponentRef<typeof RadixSelect.Item>,
  { children: ReactNode; value: string }
>(function SelectItem({ children, value, ...props }, ref) {
  return (
    <RadixSelect.Item
      ref={ref}
      value={value}
      className="relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm text-neutral-900 data-[highlighted]:bg-neutral-100 data-[highlighted]:outline-none"
      {...props}
    >
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
    </RadixSelect.Item>
  )
})
