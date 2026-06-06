import { createServerClient } from '@/lib/supabase/server'
import { OrdersTable } from '@/components/admin/OrdersTable'

export const dynamic = 'force-dynamic'

export default async function AdminPedidosPage() {
  const supabase = await createServerClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, total_amount, customer_name, customer_email, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-content">Pedidos</h1>
      <OrdersTable orders={orders ?? []} />
    </div>
  )
}
