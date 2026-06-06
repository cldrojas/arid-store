'use client'

import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { CartItem } from '@/components/store/CartItem'
import { formatCLP } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

export default function CarritoPage() {
  const { items, total } = useCart()

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-content">Tu carrito</h1>
        <p className="mt-4 text-content-muted">
          No tienes productos en tu carrito
        </p>
        <Link
          href="/productos"
          className="mt-6 inline-flex items-center rounded-lg bg-accent px-6 py-3 text-sm font-medium text-accent-content hover:bg-accent-hover transition-colors"
        >
          Ver productos
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-content">Tu carrito</h1>

      <div className="mt-8 divide-y divide-edge">
        {items.map(item => (
          <CartItem key={item.variantId} item={item} />
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-edge pt-6">
        <span className="text-lg font-semibold text-content">
          Total: {formatCLP(total)}
        </span>
        <Link href="/checkout">
          <Button size="lg">Ir al checkout</Button>
        </Link>
      </div>
    </div>
  )
}
