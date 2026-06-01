import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/store/ProductCard'

export const revalidate = 60

export default async function HomePage() {
  const supabase = await createServerClient()

  const { data: products } = await supabase
    .from('products')
    .select(`
      id, slug, name, base_price,
      images:product_images(storage_path, is_primary, sort_order)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(4)

  return (
    <div>
      {/* Hero */}
      <section className="bg-linear-to-b from-neutral-50 to-white py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 md:text-5xl">
            Poleras con diseño
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-lg text-neutral-600">
            Descubre nuestra colección de poleras estampadas. Diseños exclusivos,
            materiales de calidad, envió a todo Chile.
          </p>
          <Link
            href="/productos"
            className="mt-8 inline-flex items-center rounded-lg bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
          >
            Ver colección
          </Link>
        </div>
      </section>

      {/* Nuevos diseños */}
      {products && products.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold text-neutral-900">
            Nuevos diseños
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
