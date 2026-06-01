'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProductForm } from '@/components/admin/ProductForm'

type ProductData = {
  id: string
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
}

export default function EditarProductoPage() {
  const params = useParams()
  const [data, setData] = useState<ProductData | null>(null)
  const [loading, setLoading] = useState(true)
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
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description ?? '',
        base_price: product.base_price,
        is_active: product.is_active,
        variants: (variants ?? []).map(v => ({
          size: v.size,
          color: v.color,
          color_hex: v.color_hex ?? '',
          stock: v.stock,
          sku: v.sku ?? '',
          price_override: v.price_override ? String(v.price_override) : ''
        })),
        images: (images ?? []).map(img => ({
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

  if (loading) {
    return <div className="text-center text-neutral-500 py-12">Cargando producto...</div>
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
      {data && <ProductForm initialData={data} />}
    </div>
  )
}
