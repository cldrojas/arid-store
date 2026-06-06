import { createServerClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/store/ProductCard'

export const revalidate = 60

export default async function ProductosPage() {
  const supabase = await createServerClient()

  const { data: products } = await supabase
    .from('products')
    .select(`
      id, slug, name, base_price,
      images:product_images(storage_path, is_primary, sort_order)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-bold text-content">Productos</h1>

      {!products || products.length === 0 ? (
        <div className="mt-16 text-center text-content-muted">
          <p className="text-lg">Próximamente nuevos diseños</p>
          <p className="mt-2 text-sm">
            Estamos trabajando en nuestra colección. Vuelve pronto.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
