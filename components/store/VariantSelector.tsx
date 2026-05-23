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
        <label className="text-sm font-medium text-neutral-700">Talla</label>
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
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : hasStock
                      ? 'border-neutral-300 text-neutral-900 hover:border-neutral-500'
                      : 'cursor-not-allowed border-neutral-200 text-neutral-300 opacity-40'
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
      <label className="text-sm font-medium text-neutral-700">Color</label>
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
                    ? 'border-neutral-900'
                    : 'border-neutral-300'
                }`}
                style={{
                  backgroundColor: color_hex || '#e5e5e5'
                }}
              />
              {!hasStock && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="h-0.5 w-8 rotate-45 rounded-full bg-neutral-400" />
                </span>
              )}
            </button>
          )
        })}
      </div>
      {selectedValue && (
        <p className="text-xs text-neutral-500 capitalize">{selectedValue}</p>
      )}
    </div>
  )
}
