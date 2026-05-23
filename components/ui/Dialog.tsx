'use client'

import * as RadixDialog from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'

type DialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  trigger?: ReactNode
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  trigger
}: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && (
        <RadixDialog.Trigger asChild>
          {trigger}
        </RadixDialog.Trigger>
      )}
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <RadixDialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl">
          <RadixDialog.Title className="text-lg font-semibold text-neutral-900">
            {title}
          </RadixDialog.Title>
          {description && (
            <RadixDialog.Description className="mt-2 text-sm text-neutral-600">
              {description}
            </RadixDialog.Description>
          )}
          <div className="mt-4">
            {children}
          </div>
          <RadixDialog.Close asChild>
            <button
              className="absolute right-4 top-4 inline-flex items-center justify-center rounded-md p-1 text-neutral-400 hover:text-neutral-600 focus:outline-none"
              aria-label="Cerrar"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 4L12 12M12 4L4 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </RadixDialog.Close>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}

export const DialogTrigger = RadixDialog.Trigger
export const DialogClose = RadixDialog.Close
export const DialogTitle = RadixDialog.Title
export const DialogDescription = RadixDialog.Description
