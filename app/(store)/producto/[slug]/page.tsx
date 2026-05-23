import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProductDetailClient } from './ProductDetailClient'
import type { Product, ProductVariant, ProductImage } from '@/types'

export const revalidate = 60

export async function generateStaticParams() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('products')
    .select('slug')
    .eq('is_active', true)
  return data?.map(p => ({ slug: p.slug })) ?? []
}

export default async function ProductoPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createServerClient()

  const { data: product } = await supabase
    .from('products')
    .select('*, variants:product_variants(*), images:product_images(*)')
    .eq('slug', slug)
    .single()

  if (!product) notFound()

  return (
    <ProductDetailClient
      product={product as Product & { variants: ProductVariant[]; images: ProductImage[] }}
    />
  )
}
