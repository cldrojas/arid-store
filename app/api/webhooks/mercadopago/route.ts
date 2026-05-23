import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendOrderConfirmation } from '@/lib/resend'
import type { Order, OrderStatus } from '@/types'

// Mapa de estados de MercadoPago a estados internos
const MP_STATUS_MAP: Record<string, OrderStatus> = {
  approved: 'approved',
  rejected: 'rejected',
  cancelled: 'cancelled',
  refunded: 'cancelled',
  charged_back: 'cancelled',
  in_process: 'pending',
  pending: 'pending',
  authorized: 'pending'
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = await req.json()
    const { action, data } = body

    // Solo procesar eventos de pago
    if (!['payment.updated', 'payment.created'].includes(action)) {
      return NextResponse.json({ ok: true })
    }

    const paymentId = data?.id
    if (!paymentId) return NextResponse.json({ ok: true })

    // Consultar el pago en MercadoPago
    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`
        }
      }
    )

    if (!mpResponse.ok) {
      console.error(`[Webhook MP] Error consultando payment ${paymentId}`)
      return NextResponse.json({ ok: true }) // siempre 200
    }

    const payment = await mpResponse.json()
    const orderId: string = payment.external_reference
    const mpStatus: string = payment.status
    const newStatus = MP_STATUS_MAP[mpStatus] ?? 'pending'

    if (!orderId) {
      console.error('[Webhook MP] external_reference vacío')
      return NextResponse.json({ ok: true })
    }

    const supabase = createAdminClient()

    // Verificar idempotencia: si ya tiene este mp_payment_id, no reprocesar
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, status, mp_payment_id, customer_email')
      .eq('id', orderId)
      .single()

    if (!existingOrder) {
      console.error(`[Webhook MP] Orden ${orderId} no encontrada`)
      return NextResponse.json({ ok: true })
    }

    if (existingOrder.mp_payment_id === String(paymentId)) {
      // Ya procesado, idempotente
      return NextResponse.json({ ok: true })
    }

    // Actualizar estado de la orden
    await supabase
      .from('orders')
      .update({
        status: newStatus,
        mp_payment_id: String(paymentId),
        metadata: payment
      })
      .eq('id', orderId)

    // Acciones post-pago aprobado
    if (newStatus === 'approved' && existingOrder.status !== 'approved') {
      // Descontar stock de cada variant de forma segura
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('variant_id, quantity')
        .eq('order_id', orderId)

      if (orderItems) {
        for (const item of orderItems) {
          await supabase.rpc('decrement_stock', {
            p_variant_id: item.variant_id,
            p_quantity: item.quantity
          })
        }
      }

      // Obtener orden completa para el email
      const { data: fullOrder } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('id', orderId)
        .single()

      if (fullOrder) {
        await sendOrderConfirmation(fullOrder as Order)
      }
    }

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error('[Webhook MP] Error no controlado:', error)
    return NextResponse.json({ ok: true }) // siempre 200
  }
}
