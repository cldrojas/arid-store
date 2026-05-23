'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProductForm } from '@/components/admin/ProductForm'

type ProductData = {
  name: string
  slug: string
  description: string
  base_price: number
  is_active: boolean
  variants: Array<{
    id?: string
    size: string
    color: string
    color_hex: string
    stock: number
    sku: string
    price_override: string
  }>
  images: Array<{
    id?: string
    storage_path: string
    alt_text: string
    is_primary: boolean
    sort_order: number
  }>
}

export default function EditarProductoPage() {
  const params = useParams()
  const router = useRouter()
  const [data, setData] = useState<ProductData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', params.id)
        .single()

      if (!product) {
        setError('Producto no encontrado')
        setLoading(false)
        return
      }

      const { data: variants } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', params.id)

      const { data: images } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', params.id)
        .order('sort_order')

      setData({
        name: product.name,
        slug: product.slug,
        description: product.description ?? '',
        base_price: product.base_price,
        is_active: product.is_active,
        variants: (variants ?? []).map(v => ({
          id: v.id,
          size: v.size,
          color: v.color,
          color_hex: v.color_hex ?? '',
          stock: v.stock,
          sku: v.sku ?? '',
          price_override: v.price_override ? String(v.price_override) : ''
        })),
        images: (images ?? []).map(img => ({
          id: img.id,
          storage_path: img.storage_path,
          alt_text: img.alt_text ?? '',
          is_primary: img.is_primary,
          sort_order: img.sort_order
        }))
      })
      setLoading(false)
    }

    load()
  }, [params.id])

  async function handleSubmit(formData: ProductData) {
    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()

      // 1. Actualizar producto
      const { error: updateError } = await supabase
        .from('products')
        .update({
          name: formData.name,
          slug: formData.slug,
          description: formData.description || null,
          base_price: formData.base_price,
          is_active: formData.is_active
        })
        .eq('id', params.id)

      if (updateError) {
        setError(updateError.message)
        return
      }

      // 2. Eliminar variantes antiguas y crear nuevas
      await supabase
        .from('product_variants')
        .delete()
        .eq('product_id', params.id)

      const validVariants = formData.variants.filter(v => v.color.trim())
      if (validVariants.length > 0) {
        const { error: vError } = await supabase
          .from('product_variants')
          .insert(
            validVariants.map(v => ({
              product_id: params.id,
              size: v.size,
              color: v.color,
              color_hex: v.color_hex || null,
              stock: v.stock,
              sku: v.sku || null,
              price_override: v.price_override ? Number(v.price_override) : null
            }))
          )

        if (vError) {
          setError(vError.message)
          return
        }
      }

      // 3. Eliminar imágenes antiguas y crear nuevas
      await supabase
        .from('product_images')
        .delete()
        .eq('product_id', params.id)

      const validImages = formData.images.filter(i => i.storage_path.trim())
      if (validImages.length > 0) {
        const { error: iError } = await supabase
          .from('product_images')
          .insert(
            validImages.map(img => ({
              product_id: params.id,
              variant_id: null,
              storage_path: img.storage_path,
              alt_text: img.alt_text || null,
              sort_order: img.sort_order,
              is_primary: img.is_primary
            }))
          )

        if (iError) {
          setError(iError.message)
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

  if (loading) {
    return (
      <div className="text-center text-neutral-500 py-12">Cargando producto...</div>
    )
  }

  if (error && !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">Editar producto</h1>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {data && (
        <ProductForm
          initialData={data}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  )
}
