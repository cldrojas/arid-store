import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'

export const revalidate = 60

export default async function Home() {
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
    <div className="flex flex-col flex-1">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <span className="text-lg font-bold text-neutral-900">Arid Store</span>
          <nav className="flex items-center gap-6">
            <Link
              href="/productos"
              className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Productos
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 bg-gradient-to-b from-neutral-50 to-white py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 md:text-5xl">
            Poleras con diseño
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-lg text-neutral-600">
            Descubre nuestra colección de poleras estampadas. Diseños exclusivos,
            materiales de calidad, envío a todo Chile.
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
              <Link
                key={product.id}
                href={`/producto/${product.slug}`}
                className="group rounded-lg border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300"
              >
                <div className="aspect-square rounded-md bg-neutral-100" />
                <h3 className="mt-3 text-sm font-medium text-neutral-900 group-hover:text-neutral-700 transition-colors">
                  {product.name}
                </h3>
                <p className="mt-1 text-sm text-neutral-500">
                  ${product.base_price.toLocaleString('es-CL')}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <p className="text-center text-sm text-neutral-500">
            &copy; {new Date().getFullYear()} Arid Store. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
