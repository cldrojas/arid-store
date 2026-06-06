import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { formatCLP, shortId } from '@/lib/utils'
import { imagePresets } from '@/lib/images'
import { Button } from '@/components/ui/Button'

export const dynamic = 'force-dynamic'

export default async function AdminProductosPage() {
  const supabase = await createServerClient()

  const { data: products } = await supabase
    .from('products')
    .select(`
      id, slug, name, base_price, is_active,
      images:product_images(storage_path, is_primary, sort_order),
      variants:product_variants(id, stock)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-content">Productos</h1>
        <Link href="/admin/productos/nuevo">
          <Button>Nuevo producto</Button>
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-edge">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-edge bg-surface-secondary text-left text-xs font-medium uppercase text-content-muted">
              <th className="px-4 py-3">Imagen</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Variantes</th>
              <th className="px-4 py-3">Stock total</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {!products || products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-content-muted">
                  No hay productos
                </td>
              </tr>
            ) : (
              products.map(product => {
                const primaryImage = product.images?.find(i => i.is_primary) ?? product.images?.[0]
                const variantCount = product.variants?.length ?? 0
                const totalStock = product.variants?.reduce((acc, v) => acc + v.stock, 0) ?? 0

                return (
                  <tr
                    key={product.id}
                    className="border-b border-edge last:border-0 hover:bg-surface-secondary"
                  >
                    <td className="px-4 py-3">
                      {primaryImage ? (
                        <img
                          src={imagePresets.adminThumb(primaryImage.storage_path)}
                          alt={product.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-tertiary text-xs text-content-muted">
                          Sin img
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-content">{product.name}</p>
                      <p className="text-xs text-content-muted">{product.slug}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-content">
                      {formatCLP(product.base_price)}
                    </td>
                    <td className="px-4 py-3 text-content-secondary">
                      {variantCount}
                    </td>
                    <td className="px-4 py-3 text-content-secondary">
                      {totalStock}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        product.is_active
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-surface-tertiary text-content-muted'
                      }`}>
                        {product.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/productos/${product.id}`}
                        className="text-sm font-medium text-content-secondary hover:text-content"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
