import { Resend } from 'resend'
import { OrderConfirmation } from '@/emails/OrderConfirmation'
import type { Order } from '@/types'

let _resend: Resend | null = null

function getResend(): Resend | null {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.warn('[Resend] RESEND_API_KEY no configurado — emails desactivados')
      return null
    }
    _resend = new Resend(apiKey)
  }
  return _resend
}

export async function sendOrderConfirmation(order: Order): Promise<void> {
  const resend = getResend()
  if (!resend) return

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: order.customer_email,
      subject: `Pedido confirmado #${order.id.substring(0, 8).toUpperCase()}`,
      react: OrderConfirmation({ order })
    })
  } catch (error) {
    // Error no fatal: el pago ya fue procesado
    // El email puede fallar sin afectar la orden
    console.error('[Resend] Error enviando email de confirmación:', error)
  }
}
