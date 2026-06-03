import { NextResponse } from 'next/server'
import { WebhookSignature } from 'fintoc'
import { WebhookSignatureError } from 'fintoc'
import { createAdminClient } from '@/lib/supabase/server'
import { sendOrderConfirmation } from '@/lib/resend'
import type { Order } from '@/types'

type FintocEvent = {
  type: 'checkout_session.finished' | 'payment_intent.succeeded' | 'payment_intent.failed'
  data: {
    id: string
    object: 'payment_intent'
    amount: number
    status: 'succeeded' | 'failed'
    metadata: {
      order_id: string
    }
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    // 1. Verificar firma del webhook
    const rawBody = await req.text()
    const signature = req.headers.get('fintoc-signature')

    if (!signature) {
      console.warn('[Webhook Fintoc] Header Fintoc-Signature ausente')
      return NextResponse.json({ ok: true })
    }

    try {
      WebhookSignature.verifyHeader(
        rawBody,
        signature,
        process.env.FINTOC_WEBHOOK_SECRET!
      )
    } catch (err) {
      if (err instanceof WebhookSignatureError) {
        console.error('[Webhook Fintoc] Firma inválida:', err.message)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
      throw err
    }

    const body: FintocEvent = JSON.parse(rawBody)
    const { type, data } = body

    // Solo procesar eventos de pago
    if (!['checkout_session.finished', 'payment_intent.succeeded', 'payment_intent.failed'].includes(type)) {
      return NextResponse.json({ ok: true })
    }

    const paymentIntentId = data?.id
    const orderId = data?.metadata?.order_id

    if (!paymentIntentId || !orderId) {
      console.warn('[Webhook Fintoc] Payload malformado: faltan data.id o metadata.order_id')
      return NextResponse.json({ ok: true })
    }

    const supabase = createAdminClient()

    // Verificar idempotencia: si ya tiene este payment_intent_id, no reprocesar
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, status, payment_intent_id, customer_email')
      .eq('id', orderId)
      .single()

    if (!existingOrder) {
      console.warn(`[Webhook Fintoc] Orden ${orderId} no encontrada`)
      return NextResponse.json({ ok: true })
    }

    if (existingOrder.payment_intent_id === paymentIntentId) {
      // Ya procesado, idempotente
      return NextResponse.json({ ok: true })
    }

    // Determinar nuevo estado según el tipo de evento
    const isApproved = type === 'checkout_session.finished' || type === 'payment_intent.succeeded'
    const newStatus = isApproved ? 'approved' : 'rejected'

    // Actualizar estado de la orden
    await supabase
      .from('orders')
      .update({
        status: newStatus,
        payment_intent_id: paymentIntentId,
        metadata: data
      })
      .eq('id', orderId)

    // Acciones post-pago aprobado
    if (isApproved && existingOrder.status !== 'approved') {
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
    console.error('[Webhook Fintoc] Error no controlado:', error)
    return NextResponse.json({ ok: true }) // siempre 200
  }
}
