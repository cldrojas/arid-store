'use client'

import type { ProductVariant } from '@/types'

type VariantSelectorProps = {
  variants: Pick<ProductVariant, 'id' | 'size' | 'color' | 'color_hex' | 'stock'>[]
  selectedValue: string | null
  onChange: (value: string) => void
  type: 'size' | 'color'
}

export function VariantSelector({
  variants,
  selectedValue,
  onChange,
  type
}: VariantSelectorProps) {
  if (type === 'size') {
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
    const uniqueSizes = Array.from(
      new Set(variants.map(v => v.size))
    ).sort((a, b) => sizeOrder.indexOf(a) - sizeOrder.indexOf(b))

    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-content-tertiary">Talla</label>
        <div className="flex flex-wrap gap-2">
          {uniqueSizes.map(size => {
            const hasStock = variants.some(
              v => v.size === size && v.stock > 0
            )
            return (
              <button
                key={size}
                onClick={() => hasStock && onChange(size)}
                disabled={!hasStock}
                className={`min-w-[48px] rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  selectedValue === size
                    ? 'border-accent bg-accent text-accent-content'
                    : hasStock
                      ? 'border-edge-strong text-content hover:border-content-muted'
                      : 'cursor-not-allowed border-edge text-content-muted opacity-40'
                }`}
              >
                {size}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // type === 'color'
  const uniqueColors = variants.reduce<
    Array<{ color: string; color_hex: string | null }>
  >((acc, v) => {
    if (!acc.find(c => c.color === v.color)) {
      acc.push({ color: v.color, color_hex: v.color_hex })
    }
    return acc
  }, [])

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-content-tertiary">Color</label>
      <div className="flex flex-wrap gap-3">
        {uniqueColors.map(({ color, color_hex }) => {
          const hasStock = variants.some(
            v => v.color === color && v.stock > 0
          )
          return (
            <button
              key={color}
              onClick={() => hasStock && onChange(color)}
              disabled={!hasStock}
              title={color}
              className={`relative h-10 w-10 rounded-full transition-all ${
                !hasStock ? 'cursor-not-allowed opacity-40' : 'hover:scale-110'
              }`}
            >
              <span
                className={`block h-10 w-10 rounded-full border-2 ${
                  selectedValue === color
                    ? 'border-accent'
                    : 'border-edge-strong'
                }`}
                style={{
                  backgroundColor: color_hex || '#e5e5e5'
                }}
              />
              {!hasStock && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="h-0.5 w-8 rotate-45 rounded-full bg-content-muted" />
                </span>
              )}
            </button>
          )
        })}
      </div>
      {selectedValue && (
        <p className="text-xs text-content-muted capitalize">{selectedValue}</p>
      )}
    </div>
  )
}
