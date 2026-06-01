'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/fintoc'
import type { CheckoutPayload, CheckoutResponse } from '@/types'

export async function checkoutAction(
  _prevState: CheckoutResponse | null,
  payload: CheckoutPayload
): Promise<CheckoutResponse> {
  try {
    const { items, customer } = payload

    // 1. Validación básica
    if (!items?.length || !customer?.email || !customer?.name) {
      return { error: 'VALIDATION_ERROR', message: 'Datos incompletos' }
    }

    const supabase = createAdminClient()

    // 2. Verificar stock y obtener precios reales desde Supabase
    const variantIds = items.map(i => i.variantId)
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('id, stock, price_override, product_id, size, color, products(name, base_price)')
      .in('id', variantIds)

    if (variantsError || !variants) {
      return { error: 'VALIDATION_ERROR', message: 'Error al verificar productos' }
    }

    // 3. Verificar que todos los variants existen y tienen stock
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

      const product = variant.products as unknown as { name: string; base_price: number } | null
      if (!product) {
        failedItems.push(item.variantId)
        continue
      }
      const unit_price = variant.price_override ?? product.base_price

      enrichedItems.push({
        variantId: item.variantId,
        title: `${product.name} - Talla ${variant.size} ${variant.color}`,
        unit_price,
        quantity: item.quantity,
        variantDesc: `Talla ${variant.size} - ${variant.color}`
      })
    }

    if (failedItems.length > 0) {
      return { error: 'INSUFFICIENT_STOCK', failedItems }
    }

    const totalAmount = enrichedItems.reduce(
      (acc, item) => acc + item.unit_price * item.quantity,
      0
    )

    // 4. Crear orden en Supabase con status='pending'
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
      return { error: 'VALIDATION_ERROR', message: 'Error al crear la orden' }
    }

    // 5. Insertar order_items
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

    // 6. Crear checkout session en Fintoc
    const session = await createCheckoutSession({
      orderId: order.id,
      amount: totalAmount,
      customerEmail: customer.email
    })

    // 7. Guardar payment_session_id en la orden
    await supabase
      .from('orders')
      .update({ payment_session_id: session.sessionId })
      .eq('id', order.id)

    return { redirectUrl: session.redirectUrl }

  } catch (error) {
    console.error('[Checkout Action]', error)
    return { error: 'VALIDATION_ERROR', message: 'Error interno del servidor' }
  }
}
