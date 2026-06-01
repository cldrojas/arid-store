import React, { type ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { CartProvider } from '@/context/CartContext'

function AllProviders({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options })
}

export * from '@testing-library/react'
export { customRender as render }
