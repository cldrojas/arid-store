// IMPORTANTE: Este archivo solo se importa en server-side
// Route Handlers y Server Actions únicamente
import { MercadoPagoConfig, Preference } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!
})

type CreatePreferenceInput = {
  orderId: string
  items: Array<{
    title: string
    unit_price: number   // CLP entero
    quantity: number
  }>
  payer: {
    name: string
    email: string
  }
}

export async function createPreference(input: CreatePreferenceInput) {
  const preference = new Preference(client)

  return preference.create({
    body: {
      items: input.items.map(item => ({
        id: item.title,
        title: item.title,
        unit_price: item.unit_price,
        quantity: item.quantity,
        currency_id: 'CLP'
      })),
      payer: {
        name: input.payer.name,
        email: input.payer.email
      },
      external_reference: input.orderId,
      // back_urls se configuran desde el dashboard de Mercado Pago
      // para evitar errores por URL inválida en preview/desarrollo
      notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/mercadopago`
    }
  })
}
