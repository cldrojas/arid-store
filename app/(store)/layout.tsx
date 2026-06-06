'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CartProvider, useCart } from '@/context/CartContext'
import { CartDrawer } from '@/components/store/CartDrawer'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import type { ReactNode } from 'react'

function StoreHeader() {
  const [cartOpen, setCartOpen] = useState(false)
  const { itemCount } = useCart()
  const isDev = process.env.NODE_ENV === 'development'

  return (
    <>
      <header className={`sticky top-0 z-30 border-b bg-surface ${
        isDev ? 'border-fuchsia-400' : 'border-edge'
      }`}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold text-content">
            Arid Store
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              href="/productos"
              className="text-sm text-content-secondary hover:text-content transition-colors"
            >
              Productos
            </Link>

            <ThemeToggle />

            <button
              onClick={() => setCartOpen(true)}
              className="relative rounded-md p-2 text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors"
              aria-label="Abrir carrito"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M3 4H4.5L6.5 12.5H15L17 6H5.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="7" cy="16" r="1" fill="currentColor" />
                <circle cx="14" cy="16" r="1" fill="currentColor" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-accent-content text-[10px] font-bold">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <StoreHeader />
      <main className="flex-1 bg-linear-to-b from-surface-secondary to-surface">{children}</main>
      <StoreFooter />
    </CartProvider>
  )
}

function StoreFooter() {
  return (
    <footer className="border-t border-edge bg-surface-secondary">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-center text-sm text-content-muted">
          © {new Date().getFullYear()} Arid Store. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}
