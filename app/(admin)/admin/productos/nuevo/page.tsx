'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProductForm } from '@/components/admin/ProductForm'

export default function NuevoProductoPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(data: {
    name: string
    slug: string
    description: string
    base_price: number
    is_active: boolean
    variants: Array<{
      size: string
      color: string
      color_hex: string
      stock: number
      sku: string
      price_override: string
    }>
    images: Array<{
      storage_path: string
      alt_text: string
      is_primary: boolean
      sort_order: number
    }>
  }) {
    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()

      // 1. Crear producto
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name: data.name,
          slug: data.slug,
          description: data.description || null,
          base_price: data.base_price,
          is_active: data.is_active
        })
        .select('id')
        .single()

      if (productError || !product) {
        setError(productError?.message ?? 'Error al crear producto')
        return
      }

      // 2. Crear variantes
      const validVariants = data.variants.filter(v => v.color.trim())
      if (validVariants.length > 0) {
        const { error: variantsError } = await supabase
          .from('product_variants')
          .insert(
            validVariants.map(v => ({
              product_id: product.id,
              size: v.size,
              color: v.color,
              color_hex: v.color_hex || null,
              stock: v.stock,
              sku: v.sku || null,
              price_override: v.price_override ? Number(v.price_override) : null
            }))
          )

        if (variantsError) {
          setError(variantsError.message)
          return
        }
      }

      // 3. Crear imágenes
      const validImages = data.images.filter(i => i.storage_path.trim())
      if (validImages.length > 0) {
        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(
            validImages.map(img => ({
              product_id: product.id,
              variant_id: null,
              storage_path: img.storage_path,
              alt_text: img.alt_text || null,
              sort_order: img.sort_order,
              is_primary: img.is_primary
            }))
          )

        if (imagesError) {
          setError(imagesError.message)
          return
        }
      }

      router.push('/admin/productos')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">Nuevo producto</h1>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <ProductForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  )
}
