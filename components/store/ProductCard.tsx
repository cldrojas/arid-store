import Link from 'next/link'
import { imagePresets } from '@/lib/images'
import { formatCLP } from '@/lib/utils'
import type { ProductImage } from '@/types'

type ProductCardProduct = {
  id: string
  slug: string
  name: string
  base_price: number
  images?: Pick<ProductImage, 'storage_path' | 'is_primary' | 'sort_order'>[]
}

type ProductCardProps = {
  product: ProductCardProduct
}

export function ProductCard({ product }: ProductCardProps) {
  const primaryImage =
    product.images?.find(i => i.is_primary) || product.images?.[0]
  const imageUrl = primaryImage
    ? imagePresets.card(primaryImage.storage_path)
    : null

  return (
    <Link href={`/producto/${product.slug}`} className="group block">
      <div className="aspect-square overflow-hidden rounded-lg bg-neutral-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-400">
            Sin imagen
          </div>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="text-sm font-medium text-neutral-900">
          {product.name}
        </h3>
        <p className="text-sm text-neutral-700">
          {formatCLP(product.base_price)}
        </p>
      </div>
    </Link>
  )
}
