import { Resend } from 'resend'
import { OrderConfirmation } from '@/emails/OrderConfirmation'
import type { Order } from '@/types'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendOrderConfirmation(order: Order): Promise<void> {
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
