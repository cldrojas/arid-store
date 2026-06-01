'use client'

import { useEffect, useState, useActionState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { formatCLP } from '@/lib/utils'
import { CheckoutForm } from '@/components/store/CheckoutForm'
import { checkoutAction } from '@/lib/actions/checkout'
import type { ShippingAddress, CheckoutResponse, CheckoutPayload } from '@/types'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total } = useCart()
  const [error, setError] = useState<string | null>(null)
  const [state, dispatch, isPending] = useActionState(checkoutAction, null)

  useEffect(() => {
    if (items.length === 0) {
      router.replace('/carrito')
    }
  }, [items.length, router])

  // Manejar resultado de la Server Action
  useEffect(() => {
    if (!state) return

    if ('redirectUrl' in state) {
      window.location.href = state.redirectUrl
    } else if (state.error === 'INSUFFICIENT_STOCK' && 'failedItems' in state) {
      setError(
        `Stock insuficiente para algunos productos: ${state.failedItems.join(', ')}`
      )
    } else if (state.error === 'VALIDATION_ERROR') {
      setError(state.message ?? 'Error al procesar el pedido')
    }
  }, [state])

  if (items.length === 0) {
    return null // Redirigiendo...
  }

  async function handleSubmit(data: {
    name: string
    email: string
    phone: string
    address: ShippingAddress
  }) {
    setError(null)

    const payload: CheckoutPayload = {
      items: items.map(i => ({
        variantId: i.variantId,
        quantity: i.quantity
      })),
      customer: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address
      }
    }

    startTransition(() => {
      dispatch(payload)
    })
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-neutral-900">Checkout</h1>

      <div className="mt-8 grid gap-8 md:grid-cols-5">
        <div className="md:col-span-3">
          <CheckoutForm onSubmit={handleSubmit} isSubmitting={isPending} />
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
