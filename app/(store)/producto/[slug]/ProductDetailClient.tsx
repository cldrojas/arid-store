'use client'

import { useState, useMemo } from 'react'
import type { Product, ProductVariant, ProductImage } from '@/types'
import { formatCLP } from '@/lib/utils'
import { imagePresets } from '@/lib/images'
import { ProductGallery } from '@/components/store/ProductGallery'
import { VariantSelector } from '@/components/store/VariantSelector'
import { AddToCartButton } from '@/components/store/AddToCartButton'

type ProductDetailProps = {
  product: Product & { variants: ProductVariant[]; images: ProductImage[] }
}

export function ProductDetailClient({ product }: ProductDetailProps) {
  const variants = product.variants ?? []
  const images = product.images ?? []

  const [selectedColor, setSelectedColor] = useState<string | null>(
    variants.find(v => v.stock > 0)?.color ?? null
  )
  const [selectedSize, setSelectedSize] = useState<string | null>(
    variants.find(v => v.stock > 0)?.size ?? null
  )

  // Encontrar el variant seleccionado
  const selectedVariant = useMemo(() => {
    if (!selectedColor || !selectedSize) return null
    return variants.find(
      v => v.color === selectedColor && v.size === selectedSize
    ) ?? null
  }, [selectedColor, selectedSize, variants])

  // Filtrar variantes por color y talla para saber qué opciones mostrar
  const variantsByColor = useMemo(
    () => variants.filter(v => !selectedSize || v.size === selectedSize),
    [variants, selectedSize]
  )

  const variantsBySize = useMemo(
    () => variants.filter(v => !selectedColor || v.color === selectedColor),
    [variants, selectedColor]
  )

  const stock = selectedVariant?.stock ?? 0
  const price = selectedVariant?.price_override ?? product.base_price
  const variantDesc = selectedVariant
    ? `Talla ${selectedVariant.size} - ${selectedVariant.color}`
    : ''

  // Encontrar imagen del variant o la primary
  const variantImage = useMemo(() => {
    if (selectedVariant) {
      const vImg = images.find(i => i.variant_id === selectedVariant.id)
      if (vImg) return vImg
    }
    return images.find(i => i.is_primary) ?? images[0] ?? null
  }, [selectedVariant, images])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Gallery */}
        <ProductGallery images={images} />

        {/* Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {product.name}
            </h1>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">
              {formatCLP(price)}
            </p>
          </div>

          {product.description && (
            <p className="text-sm leading-relaxed text-neutral-600">
              {product.description}
            </p>
          )}

          {/* Color selector */}
          <VariantSelector
            variants={variantsBySize}
            selectedValue={selectedColor}
            onChange={setSelectedColor}
            type="color"
          />

          {/* Size selector */}
          <VariantSelector
            variants={variantsByColor}
            selectedValue={selectedSize}
            onChange={setSelectedSize}
            type="size"
          />

          {/* Stock indicator */}
          {selectedVariant && (
            <p className={`text-sm ${stock < 5 && stock > 0 ? 'text-amber-600' : 'text-neutral-500'}`}>
              {stock === 0
                ? 'Sin stock'
                : stock < 5
                  ? `Últimas ${stock} unidades`
                  : `${stock} en stock`}
            </p>
          )}

          {/* Add to cart */}
          <AddToCartButton
            variantId={selectedVariant?.id ?? ''}
            productName={product.name}
            variantDesc={variantDesc}
            price={price}
            imageUrl={variantImage ? imagePresets.card(variantImage.storage_path) : ''}
            slug={product.slug}
            stock={stock}
            disabled={!selectedVariant}
          />
        </div>
      </div>
    </div>
  )
}
