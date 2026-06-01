'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { formatCLP } from '@/lib/utils'
import { CheckoutForm } from '@/components/store/CheckoutForm'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total } = useCart()

  useEffect(() => {
    if (items.length === 0) {
      router.replace('/carrito')
    }
  }, [items.length, router])

  if (items.length === 0) {
    return null
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-neutral-900">Checkout</h1>

      <div className="mt-8 grid gap-8 md:grid-cols-5">
        <div className="md:col-span-3">
          <CheckoutForm />
        </div>

        <div className="md:col-span-2">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
            <h3 className="text-sm font-semibold text-neutral-900">
              Resumen del pedido
            </h3>
            <div className="mt-4 space-y-3">
              {items.map(item => (
                <div
                  key={item.variantId}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex-1">
                    <p className="text-neutral-900">{item.productName}</p>
                    <p className="text-xs text-neutral-500">
                      {item.variantDesc} x{item.quantity}
                    </p>
                  </div>
                  <span className="font-medium text-neutral-900">
                    {formatCLP(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-neutral-200 pt-4">
              <span className="text-sm font-semibold text-neutral-900">Total</span>
              <span className="text-lg font-bold text-neutral-900">
                {formatCLP(total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
