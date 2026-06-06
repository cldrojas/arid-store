'use client'

import { useState } from 'react'
import Link from 'next/link'
import { OrderStatusBadge } from './OrderStatusBadge'
import { formatCLP, shortId } from '@/lib/utils'
import type { Order, OrderStatus } from '@/types'

type OrdersTableProps = {
  orders: Pick<Order, 'id' | 'status' | 'total_amount' | 'customer_name' | 'customer_email' | 'created_at'>[]
}

const STATUS_FILTERS: Array<{ label: string; value: OrderStatus | 'all' }> = [
  { label: 'Todos', value: 'all' },
  { label: 'Pendiente', value: 'pending' },
  { label: 'Pagado', value: 'approved' },
  { label: 'Enviado', value: 'shipped' },
  { label: 'Entregado', value: 'delivered' }
]

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')

  const filtered =
    filter === 'all'
      ? orders
      : orders.filter(o => o.status === filter)

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === f.value
                ? 'bg-accent text-accent-content'
                : 'bg-surface-tertiary text-content-secondary hover:bg-edge'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-edge">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-edge bg-surface-secondary text-left text-xs font-medium uppercase text-content-muted">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-content-muted">
                  No hay pedidos
                </td>
              </tr>
            ) : (
              filtered.map(order => (
                <tr
                  key={order.id}
                  className="border-b border-edge last:border-0 hover:bg-surface-secondary"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/pedidos/${order.id}`}
                      className="font-mono text-sm font-medium text-content hover:text-content-secondary"
                    >
                      {shortId(order.id)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-content-secondary">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-content">{order.customer_name}</p>
                    <p className="text-xs text-content-muted">
                      {order.customer_email}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-medium text-content">
                    {formatCLP(order.total_amount)}
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
