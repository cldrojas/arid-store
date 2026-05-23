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
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-neutral-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-medium uppercase text-neutral-500">
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
                <td colSpan={5} className="px-4 py-12 text-center text-neutral-400">
                  No hay pedidos
                </td>
              </tr>
            ) : (
              filtered.map(order => (
                <tr
                  key={order.id}
                  className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/pedidos/${order.id}`}
                      className="font-mono text-sm font-medium text-neutral-900 hover:text-neutral-600"
                    >
                      {shortId(order.id)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-neutral-900">{order.customer_name}</p>
                    <p className="text-xs text-neutral-400">
                      {order.customer_email}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-medium text-neutral-900">
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
