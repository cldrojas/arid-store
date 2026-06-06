import { createServerClient } from '@/lib/supabase/server'
import { StatsCard } from '@/components/admin/StatsCard'
import { formatCLP } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const supabase = await createServerClient()

  // 1. Pedidos del día
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { count: todayOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString())

  // 2. Ventas del mes
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  const { data: monthSales } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('status', 'approved')
    .gte('created_at', monthStart.toISOString())

  const monthTotal =
    monthSales?.reduce((acc, o) => acc + o.total_amount, 0) ?? 0

  // 3. Pedidos pendientes
  const { count: pendingOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  // 4. Productos con stock bajo
  const { count: lowStockVariants } = await supabase
    .from('product_variants')
    .select('*', { count: 'exact', head: true })
    .lt('stock', 5)
    .gt('stock', 0) // con al menos 1 pero menos de 5

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-content">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v18H3z" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>}
          title="Pedidos hoy"
          value={todayOrders ?? 0}
        />
        <StatsCard
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>}
          title="Ventas del mes"
          value={formatCLP(monthTotal)}
        />
        <StatsCard
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>}
          title="Pedidos pendientes"
          value={pendingOrders ?? 0}
        />
        <StatsCard
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>}
          title="Stock bajo"
          value={lowStockVariants ?? 0}
          description="Variantes con menos de 5 unidades"
        />
      </div>
    </div>
  )
}
