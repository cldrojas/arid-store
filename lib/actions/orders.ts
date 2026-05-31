'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { OrderStatus } from '@/types'

export type OrderActionState = {
  success?: boolean
  error?: string
}

const ALLOWED_TRANSITIONS: Record<string, OrderStatus[]> = {
  approved: ['shipped'],
  shipped: ['delivered']
}

export async function updateOrderStatus(_prevState: OrderActionState, formData: FormData): Promise<OrderActionState> {
  try {
    const supabase = createAdminClient()
    const orderId = formData.get('orderId') as string
    const newStatus = formData.get('status') as OrderStatus

    // Validar que la transición está permitida
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single()

    if (fetchError || !order) {
      return { error: 'Pedido no encontrado' }
    }

    const allowed = ALLOWED_TRANSITIONS[order.status]
    if (!allowed || !allowed.includes(newStatus)) {
      return { error: `No se puede cambiar de ${order.status} a ${newStatus}` }
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)

    if (updateError) {
      return { error: updateError.message }
    }

    revalidatePath('/admin/pedidos')
    return { success: true }

  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}
