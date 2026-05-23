'use client'

import { useCart } from '@/context/CartContext'
import { Button } from '@/components/ui/Button'

type AddToCartButtonProps = {
  variantId: string
  productName: string
  variantDesc: string
  price: number
  imageUrl: string
  slug: string
  stock: number
  disabled?: boolean
}

export function AddToCartButton({
  variantId,
  productName,
  variantDesc,
  price,
  imageUrl,
  slug,
  stock,
  disabled
}: AddToCartButtonProps) {
  const { addItem } = useCart()

  if (stock === 0) {
    return (
      <Button disabled className="w-full">
        Sin stock
      </Button>
    )
  }

  return (
    <Button
      onClick={() =>
        addItem({
          variantId,
          productName,
          variantDesc,
          price,
          quantity: 1,
          imageUrl,
          slug
        })
      }
      disabled={disabled || stock === 0}
      className="w-full"
    >
      {stock === 0 ? 'Sin stock' : 'Agregar al carrito'}
    </Button>
  )
}
