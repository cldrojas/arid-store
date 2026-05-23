import { Badge } from '@/components/ui/Badge'
import type { OrderStatus } from '@/types'

const STATUS_CONFIG: Record<OrderStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'error' }> = {
  pending: { label: 'Pendiente', variant: 'warning' },
  approved: { label: 'Pagado', variant: 'success' },
  rejected: { label: 'Rechazado', variant: 'error' },
  cancelled: { label: 'Cancelado', variant: 'error' },
  shipped: { label: 'Enviado', variant: 'default' },
  delivered: { label: 'Entregado', variant: 'success' }
}

type OrderStatusBadgeProps = {
  status: OrderStatus
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: 'default' as const }

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  )
}
