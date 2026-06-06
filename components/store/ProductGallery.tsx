'use client'

import { useState } from 'react'
import { imagePresets } from '@/lib/images'
import type { ProductImage } from '@/types'

type ProductGalleryProps = {
  images: ProductImage[]
}

export function ProductGallery({ images }: ProductGalleryProps) {
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order)
  const [selectedIndex, setSelectedIndex] = useState(0)

  if (sorted.length === 0) {
    return (
      <div className="aspect-square flex items-center justify-center rounded-xl bg-surface-tertiary text-content-muted">
        Sin imagen
      </div>
    )
  }

  const current = sorted[selectedIndex]

  return (
    <div className="space-y-4">
      {/* Imagen principal */}
      <div className="aspect-square overflow-hidden rounded-xl bg-surface-tertiary">
        <img
          src={imagePresets.detail(current.storage_path)}
          alt={current.alt_text ?? 'Imagen del producto'}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Thumbnails */}
      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sorted.map((img, index) => (
            <button
              key={img.id}
              onClick={() => setSelectedIndex(index)}
              className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                index === selectedIndex
                  ? 'border-accent'
                  : 'border-transparent hover:border-edge-strong'
              }`}
            >
              <img
                src={imagePresets.thumbnail(img.storage_path)}
                alt={img.alt_text ?? `Vista ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
