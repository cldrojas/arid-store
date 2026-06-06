'use client'

import { useEffect, useState } from 'react'
import { useActionState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge'
import { formatCLP, shortId } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { updateOrderStatus, type OrderActionState } from '@/lib/actions/orders'
import type { Order, OrderItem, OrderStatus, ShippingAddress } from '@/types'

const ALLOWED_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  approved: ['shipped'],
  shipped: ['delivered']
}

export default function PedidoDetallePage() {
  const params = useParams()
  const [order, setOrder] = useState<(Order & { items: OrderItem[] }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('id', params.id)
        .single()

      if (!data) {
        setError('Pedido no encontrado')
      } else {
        setOrder(data as Order & { items: OrderItem[] })
      }
      setLoading(false)
    }

    load()
  }, [params.id])

  async function handleStatusChange(newStatus: OrderStatus) {
    const payload = new FormData()
    payload.set('orderId', order!.id)
    payload.set('status', newStatus)

    const result = await updateOrderStatus({} as OrderActionState, payload)

    if (result.success) {
      setOrder(prev => prev ? { ...prev, status: newStatus } : prev)
    } else {
      setError(result.error ?? 'Error al actualizar estado')
    }
  }

  if (loading) {
    return <div className="text-center text-content-muted py-12">Cargando pedido...</div>
  }

  if (error || !order) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
        {error ?? 'Pedido no encontrado'}
      </div>
    )
  }

  const shippingAddress = order.shipping_address as ShippingAddress
  const allowedTransitions = ALLOWED_TRANSITIONS[order.status] ?? []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content">
            Pedido #{shortId(order.id)}
          </h1>
          <p className="mt-1 text-sm text-content-muted">
            {new Date(order.created_at).toLocaleDateString('es-CL', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Datos del cliente */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-content">Datos del cliente</h2>
        <div className="rounded-xl border border-edge bg-surface p-5 text-sm">
          <p><span className="text-content-muted">Nombre:</span> {order.customer_name}</p>
          <p className="mt-1"><span className="text-content-muted">Email:</span> {order.customer_email}</p>
          {order.customer_phone && (
            <p className="mt-1"><span className="text-content-muted">Teléfono:</span> {order.customer_phone}</p>
          )}
        </div>
      </section>

      {/* Dirección de envío */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-content">Dirección de envío</h2>
        <div className="rounded-xl border border-edge bg-surface p-5 text-sm">
          <p>{shippingAddress.street}</p>
          <p>{shippingAddress.city}, {shippingAddress.region}</p>
          {shippingAddress.zip && <p>CP: {shippingAddress.zip}</p>}
          {shippingAddress.notes && (
            <p className="mt-2 text-content-muted">Notas: {shippingAddress.notes}</p>
          )}
        </div>
      </section>

      {/* Items del pedido */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-content">Items</h2>
        <div className="overflow-x-auto rounded-xl border border-edge">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge bg-surface-secondary text-left text-xs font-medium uppercase text-content-muted">
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Variante</th>
                <th className="px-4 py-3">Cantidad</th>
                <th className="px-4 py-3">Precio unitario</th>
                <th className="px-4 py-3">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map(item => (
                <tr key={item.id} className="border-b border-edge last:border-0">
                  <td className="px-4 py-3 font-medium text-content">{item.product_name}</td>
                  <td className="px-4 py-3 text-content-secondary">{item.variant_desc}</td>
                  <td className="px-4 py-3 text-content-secondary">{item.quantity}</td>
                  <td className="px-4 py-3 text-content">{formatCLP(item.unit_price)}</td>
                  <td className="px-4 py-3 font-medium text-content">{formatCLP(item.unit_price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end pr-4">
          <p className="text-lg font-bold text-content">Total: {formatCLP(order.total_amount)}</p>
        </div>
      </section>

      {/* Cambiar estado */}
      {allowedTransitions.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-content">Actualizar estado</h2>
          <div className="flex gap-3">
            {allowedTransitions.map(newStatus => (
              <Button
                key={newStatus}
                variant="outline"
                onClick={() => handleStatusChange(newStatus)}
              >
                {newStatus === 'shipped'
                  ? 'Marcar como enviado'
                  : `Marcar como ${newStatus}`}
              </Button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
