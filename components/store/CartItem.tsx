'use client'

import { useCart } from '@/context/CartContext'
import { formatCLP } from '@/lib/utils'
import type { CartItem as CartItemType } from '@/types'

type CartItemProps = {
  item: CartItemType
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart()

  const subtotal = item.price * item.quantity

  return (
    <div className="flex gap-4 py-4">
      {/* Thumbnail */}
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.productName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-neutral-400">
            Sin img
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-900">
            {item.productName}
          </p>
          <p className="text-xs text-neutral-500">{item.variantDesc}</p>
        </div>

        <div className="flex items-center justify-between">
          {/* Quantity selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-300 text-neutral-600 hover:bg-neutral-100"
              aria-label="Reducir cantidad"
            >
              −
            </button>
            <span className="w-6 text-center text-sm font-medium">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-300 text-neutral-600 hover:bg-neutral-100"
              aria-label="Aumentar cantidad"
            >
              +
            </button>
          </div>

          {/* Price and remove */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-neutral-900">
              {formatCLP(subtotal)}
            </span>
            <button
              onClick={() => removeItem(item.variantId)}
              className="text-xs text-neutral-400 hover:text-red-500"
              aria-label="Eliminar item"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
