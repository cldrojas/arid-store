'use server'

import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { createPreference } from '@/lib/mercadopago'
import { revalidatePath } from 'next/cache'

const checkoutSchema = z.object({
  items: z.array(z.object({
    variantId: z.string().uuid(),
    quantity: z.number().int().positive()
  })).min(1, 'El carrito está vacío'),
  customer: z.object({
    name: z.string().min(1, 'Nombre requerido'),
    email: z.string().email('Email inválido'),
    phone: z.string().optional(),
    address: z.object({
      street: z.string().min(1, 'Dirección requerida'),
      city: z.string().min(1, 'Ciudad requerida'),
      region: z.string().min(1, 'Región requerida'),
      zip: z.string().nullable().optional(),
      notes: z.string().nullable().optional()
    })
  })
})

export type CheckoutState = {
  success?: boolean
  initPoint?: string
  error?: string
  failedItems?: string[]
}

export async function checkout(_prevState: CheckoutState, formData: FormData): Promise<CheckoutState> {
  try {
    const rawItems = formData.get('items')
    const rawCustomer = formData.get('customer')

    if (!rawItems || !rawCustomer) {
      return { error: 'Datos incompletos' }
    }

    const parsed = checkoutSchema.safeParse({
      items: JSON.parse(rawItems as string),
      customer: JSON.parse(rawCustomer as string)
    })

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Datos inválidos'
      return { error: firstError }
    }

    const { items, customer } = parsed.data
    const supabase = createAdminClient()

    // Verificar stock
    const variantIds = items.map(i => i.variantId)
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('id, stock, price_override, size, color, products(name, base_price)')
      .in('id', variantIds)

    if (variantsError || !variants) {
      return { error: 'Error al verificar productos' }
    }

    const failedItems: string[] = []
    const enrichedItems: Array<{
      variantId: string
      title: string
      unit_price: number
      quantity: number
      variantDesc: string
    }> = []

    for (const item of items) {
      const variant = variants.find(v => v.id === item.variantId)

      if (!variant) {
        failedItems.push(item.variantId)
        continue
      }

      if (variant.stock < item.quantity) {
        failedItems.push(item.variantId)
        continue
      }

      const product = (variant.products as unknown as { name: string; base_price: number } | null)
      if (!product) {
        failedItems.push(item.variantId)
        continue
      }
      const unit_price = variant.price_override ?? product.base_price

      enrichedItems.push({
        variantId: item.variantId,
        title: `${product.name} — ${variant.size} ${variant.color}`,
        unit_price,
        quantity: item.quantity,
        variantDesc: `${variant.size} — ${variant.color}`
      })
    }

    if (failedItems.length > 0) {
      return { error: 'STOCK_INSUFFICIENT', failedItems }
    }

    const totalAmount = enrichedItems.reduce(
      (acc, item) => acc + item.unit_price * item.quantity, 0
    )

    // Crear orden
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        status: 'pending',
        total_amount: totalAmount,
        customer_email: customer.email,
        customer_name: customer.name,
        customer_phone: customer.phone ?? null,
        shipping_address: customer.address
      })
      .select('id')
      .single()

    if (orderError || !order) {
      return { error: 'Error al crear la orden' }
    }

    // Insertar order_items
    await supabase.from('order_items').insert(
      enrichedItems.map(item => ({
        order_id: order.id,
        variant_id: item.variantId,
        product_name: item.title,
        variant_desc: item.variantDesc,
        unit_price: item.unit_price,
        quantity: item.quantity
      }))
    )

    // Crear preferencia en MercadoPago
    const preference = await createPreference({
      orderId: order.id,
      items: enrichedItems.map(i => ({
        title: i.title,
        unit_price: i.unit_price,
        quantity: i.quantity
      })),
      payer: {
        name: customer.name,
        email: customer.email
      }
    })

    // Guardar preference_id
    await supabase
      .from('orders')
      .update({ mp_preference_id: preference.id })
      .eq('id', order.id)

    revalidatePath('/admin/pedidos')

    // En desarrollo usar sandbox_init_point (credenciales de prueba),
    // en producción usar init_point (credenciales de producción activadas)
    const isDev = process.env.NODE_ENV === 'development'
    return {
      success: true,
      initPoint: isDev ? preference.sandbox_init_point! : preference.init_point!
    }

  } catch (error) {
    console.error('[Checkout Action]', error)
    return { error: 'Error interno del servidor' }
  }
}
