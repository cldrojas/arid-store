// IMPORTANTE: Este archivo solo se importa en server-side
// Route Handlers y Server Actions únicamente
import { Fintoc } from 'fintoc'

const fintoc = new Fintoc(process.env.FINTOC_SECRET_KEY!)

type CreateCheckoutSessionInput = {
  orderId: string
  amount: number     // CLP entero
  customerEmail: string
}

export async function createCheckoutSession(input: CreateCheckoutSessionInput) {
  const session = await fintoc.checkoutSessions.create({
    amount: input.amount,
    currency: 'CLP',
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/resultado?status=approved`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/resultado?status=rejected`,
    customer_email: input.customerEmail,
    metadata: { order_id: input.orderId },
  })

  if (!session.redirect_url) {
    throw new Error('Fintoc session missing redirect_url')
  }

  return {
    sessionId: session.id,
    redirectUrl: session.redirect_url,
  }
}
