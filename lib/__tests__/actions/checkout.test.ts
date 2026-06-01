vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/mercadopago', () => ({
  createPreference: vi.fn(),
}))

import { createAdminClient } from '@/lib/supabase/server'
import { createPreference } from '@/lib/mercadopago'
import { checkout } from '@/lib/actions/checkout'
import { revalidatePath } from 'next/cache'

// ---------------------------------------------------------------------------
// Mock builder — emulates the Supabase chainable query builder
// ---------------------------------------------------------------------------
interface MockBuilder {
  insert: ReturnType<typeof vi.fn>
  select: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  in: ReturnType<typeof vi.fn>
  then: ReturnType<typeof vi.fn>
}

function createMockBuilder(
  resolveValue = { data: null, error: null }
): MockBuilder {
  return {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolveValue),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    then: vi.fn((resolve: (v: unknown) => void) => resolve(resolveValue)),
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function buildCheckoutFormData(input: {
  items: Array<{ variantId: string; quantity: number }>
  customer: {
    name: string
    email: string
    phone?: string
    address: {
      street: string
      city: string
      region: string
      zip?: string | null
      notes?: string | null
    }
  }
}): FormData {
  const fd = new FormData()
  fd.append('items', JSON.stringify(input.items))
  fd.append('customer', JSON.stringify(input.customer))
  return fd
}

// UUID v4 válidos
const VALID_VARIANT_ID_1 = '550e8400-e29b-41d4-a716-446655440001'
const VALID_VARIANT_ID_2 = '550e8400-e29b-41d4-a716-446655440002'

const VALID_CUSTOMER = {
  name: 'Juan Pérez',
  email: 'juan@ejemplo.cl',
  phone: '+56912345678',
  address: {
    street: 'Av. Libertador 123',
    city: 'Santiago',
    region: 'Metropolitana',
    zip: '8320000',
    notes: 'Oficina 401',
  },
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------
describe('checkout', () => {
  let variantsBuilder: MockBuilder
  let ordersBuilder: MockBuilder
  let orderItemsBuilder: MockBuilder

  beforeEach(() => {
    vi.clearAllMocks()

    variantsBuilder = createMockBuilder()
    ordersBuilder = createMockBuilder()
    orderItemsBuilder = createMockBuilder()

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'product_variants') return variantsBuilder
        if (table === 'orders') return ordersBuilder
        if (table === 'order_items') return orderItemsBuilder
        return createMockBuilder()
      }),
    } as never)

    vi.mocked(createPreference).mockResolvedValue({
      id: 'pref-123',
      init_point: 'https://mp.cl/pay/123',
    } as never)
  })

  // ── Happy path ──────────────────────────────────────────────────────

  it('✅ flujo exitoso completo: variant.products como OBJETO (el bug fix), orden creada, MP preference, initPoint devuelto', async () => {
    // Mock: variants query returns data with products as OBJECT (not array)
    // Este es el comportamiento real de Supabase many-to-one joins
    variantsBuilder.then = vi.fn((resolve) =>
      resolve({
        data: [
          {
            id: VALID_VARIANT_ID_1,
            stock: 10,
            price_override: null,
            size: 'M',
            color: 'Negro',
            products: { name: 'Camiseta Algodón', base_price: 15990 }, // <- OBJETO, no array!
          },
        ],
        error: null,
      })
    )

    // Mock: order insert returns id
    ordersBuilder.single.mockResolvedValue({
      data: { id: 'order-abc123' },
      error: null,
    })

    const result = await checkout(
      {},
      buildCheckoutFormData({
        items: [{ variantId: VALID_VARIANT_ID_1, quantity: 2 }],
        customer: VALID_CUSTOMER,
      })
    )

    // Resultado final
    expect(result).toEqual({
      success: true,
      initPoint: 'https://mp.cl/pay/123',
    })

    // 1. Variants query correcta
    expect(variantsBuilder.select).toHaveBeenCalledWith(
      'id, stock, price_override, size, color, products(name, base_price)'
    )
    expect(variantsBuilder.in).toHaveBeenCalledWith('id', [VALID_VARIANT_ID_1])

    // 2. Orden creada correctamente
    expect(ordersBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'pending',
        total_amount: 15990 * 2,
        customer_email: 'juan@ejemplo.cl',
        customer_name: 'Juan Pérez',
      })
    )
    expect(ordersBuilder.select).toHaveBeenCalledWith('id')
    expect(ordersBuilder.single).toHaveBeenCalled()

    // 3. Order_items insertados
    expect(orderItemsBuilder.insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          order_id: 'order-abc123',
          variant_id: VALID_VARIANT_ID_1,
          product_name: 'Camiseta Algodón — M Negro',
          unit_price: 15990,
          quantity: 2,
        }),
      ])
    )

    // 4. MercadoPago preference creada
    expect(createPreference).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'order-abc123',
        items: expect.arrayContaining([
          expect.objectContaining({
            title: 'Camiseta Algodón — M Negro',
            unit_price: 15990,
            quantity: 2,
          }),
        ]),
        payer: { name: 'Juan Pérez', email: 'juan@ejemplo.cl' },
      })
    )

    // 5. mp_preference_id guardado en orden
    expect(ordersBuilder.update).toHaveBeenCalledWith({
      mp_preference_id: 'pref-123',
    })
    expect(ordersBuilder.eq).toHaveBeenCalledWith('id', 'order-abc123')

    // 6. Cache revalidado
    expect(revalidatePath).toHaveBeenCalledWith('/admin/pedidos')
  })

  it('usa price_override cuando existe en vez de base_price', async () => {
    variantsBuilder.then = vi.fn((resolve) =>
      resolve({
        data: [
          {
            id: VALID_VARIANT_ID_1,
            stock: 5,
            price_override: 9990, // <- override presente
            size: 'S',
            color: 'Rojo',
            products: { name: 'Polera Outlet', base_price: 15990 },
          },
        ],
        error: null,
      })
    )

    ordersBuilder.single.mockResolvedValue({
      data: { id: 'order-xyz' },
      error: null,
    })

    await checkout(
      {},
      buildCheckoutFormData({
        items: [{ variantId: VALID_VARIANT_ID_1, quantity: 3 }],
        customer: VALID_CUSTOMER,
      })
    )

    // total_amount debe ser 9990 * 3, NO 15990 * 3
    expect(ordersBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        total_amount: 9990 * 3,
      })
    )

    expect(createPreference).toHaveBeenCalledWith(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ unit_price: 9990 }),
        ]),
      })
    )
  })

  // ── Errores de validación de entrada ────────────────────────────────

  it('❌ datos incompletos: sin items ni customer → error "Datos incompletos"', async () => {
    const fd = new FormData()
    // No agregamos nada

    const result = await checkout({}, fd)

    expect(result).toEqual({ error: 'Datos incompletos' })
    expect(createAdminClient).not.toHaveBeenCalled()
    expect(createPreference).not.toHaveBeenCalled()
  })

  it('❌ datos incompletos: sin customer → error "Datos incompletos"', async () => {
    const fd = new FormData()
    fd.append('items', JSON.stringify([{ variantId: VALID_VARIANT_ID_1, quantity: 1 }]))
    // Falta customer

    const result = await checkout({}, fd)

    expect(result).toEqual({ error: 'Datos incompletos' })
    expect(createAdminClient).not.toHaveBeenCalled()
  })

  it('❌ JSON inválido en items → error (catch block)', async () => {
    const fd = new FormData()
    fd.append('items', 'esto-no-es-json')
    fd.append('customer', JSON.stringify(VALID_CUSTOMER))

    const result = await checkout({}, fd)

    expect(result).toHaveProperty('error')
    expect(result.error).toBe('Error interno del servidor')
    expect(createAdminClient).not.toHaveBeenCalled()
  })

  it('❌ schema inválido: variantId no es UUID → error de Zod', async () => {
    const result = await checkout(
      {},
      buildCheckoutFormData({
        items: [{ variantId: 'no-soy-uuid', quantity: 1 }],
        customer: VALID_CUSTOMER,
      })
    )

    expect(result).toHaveProperty('error')
    expect(result.error).not.toBe('Datos incompletos')
    expect(createAdminClient).not.toHaveBeenCalled()
  })

  it('❌ schema inválido: carrito vacío → error "El carrito está vacío"', async () => {
    const result = await checkout(
      {},
      buildCheckoutFormData({
        items: [], // <- array vacío
        customer: VALID_CUSTOMER,
      })
    )

    expect(result).toEqual({ error: 'El carrito está vacío' })
    expect(createAdminClient).not.toHaveBeenCalled()
  })

  it('❌ schema inválido: email inválido → error Zod', async () => {
    const result = await checkout(
      {},
      buildCheckoutFormData({
        items: [{ variantId: VALID_VARIANT_ID_1, quantity: 1 }],
        customer: { ...VALID_CUSTOMER, email: 'no-es-email' },
      })
    )

    expect(result).toHaveProperty('error')
    expect(result.error).toMatch(/email/i)
    expect(createAdminClient).not.toHaveBeenCalled()
  })

  // ── Errores de Supabase / lógica de negocio ─────────────────────────

  it('❌ Error de Supabase en query variants → error "Error al verificar productos"', async () => {
    variantsBuilder.then = vi.fn((resolve) =>
      resolve({
        data: null,
        error: { message: 'Connection timeout' },
      })
    )

    const result = await checkout(
      {},
      buildCheckoutFormData({
        items: [{ variantId: VALID_VARIANT_ID_1, quantity: 1 }],
        customer: VALID_CUSTOMER,
      })
    )

    expect(result).toEqual({ error: 'Error al verificar productos' })
    expect(ordersBuilder.insert).not.toHaveBeenCalled()
    expect(createPreference).not.toHaveBeenCalled()
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('❌ variants query retorna null data sin error → error "Error al verificar productos"', async () => {
    variantsBuilder.then = vi.fn((resolve) =>
      resolve({
        data: null,
        error: null,
      })
    )

    const result = await checkout(
      {},
      buildCheckoutFormData({
        items: [{ variantId: VALID_VARIANT_ID_1, quantity: 1 }],
        customer: VALID_CUSTOMER,
      })
    )

    expect(result).toEqual({ error: 'Error al verificar productos' })
  })

  // ── STOCK_INSUFFICIENT escenarios ───────────────────────────────────

  it('❌ Variant no encontrada → STOCK_INSUFFICIENT con failedItems', async () => {
    // Supabase retorna array vacío (ninguna variante coincide)
    variantsBuilder.then = vi.fn((resolve) =>
      resolve({
        data: [],
        error: null,
      })
    )

    const result = await checkout(
      {},
      buildCheckoutFormData({
        items: [{ variantId: VALID_VARIANT_ID_1, quantity: 1 }],
        customer: VALID_CUSTOMER,
      })
    )

    expect(result).toEqual({
      error: 'STOCK_INSUFFICIENT',
      failedItems: [VALID_VARIANT_ID_1],
    })
    expect(ordersBuilder.insert).not.toHaveBeenCalled()
    expect(createPreference).not.toHaveBeenCalled()
  })

  it('❌ Una variante existe, otra no → solo la faltante en failedItems', async () => {
    variantsBuilder.then = vi.fn((resolve) =>
      resolve({
        data: [
          {
            id: VALID_VARIANT_ID_1,
            stock: 5,
            price_override: null,
            size: 'M',
            color: 'Negro',
            products: { name: 'Producto Ok', base_price: 10000 },
          },
          // VALID_VARIANT_ID_2 NO está en el resultado
        ],
        error: null,
      })
    )

    const result = await checkout(
      {},
      buildCheckoutFormData({
        items: [
          { variantId: VALID_VARIANT_ID_1, quantity: 1 },
          { variantId: VALID_VARIANT_ID_2, quantity: 1 }, // <- no existe
        ],
        customer: VALID_CUSTOMER,
      })
    )

    expect(result).toEqual({
      error: 'STOCK_INSUFFICIENT',
      failedItems: [VALID_VARIANT_ID_2],
    })
  })

  it('❌ Stock insuficiente → STOCK_INSUFFICIENT', async () => {
    variantsBuilder.then = vi.fn((resolve) =>
      resolve({
        data: [
          {
            id: VALID_VARIANT_ID_1,
            stock: 2, // <- stock es 2
            price_override: null,
            size: 'L',
            color: 'Azul',
            products: { name: 'Jean Slim', base_price: 29990 },
          },
        ],
        error: null,
      })
    )

    const result = await checkout(
      {},
      buildCheckoutFormData({
        items: [{ variantId: VALID_VARIANT_ID_1, quantity: 5 }], // <- pide 5
        customer: VALID_CUSTOMER,
      })
    )

    expect(result).toEqual({
      error: 'STOCK_INSUFFICIENT',
      failedItems: [VALID_VARIANT_ID_1],
    })
  })

  it('❌ Product join es null (EL BUG QUE ARREGLAMOS) → STOCK_INSUFFICIENT', async () => {
    // Este es el escenario del bug:
    // El código ANTES hacía `variant.products as Array[...][0]`
    // Pero products es un OBJETO (o null), no un array.
    // Si falla el JOIN por alguna razón, products viene null.

    variantsBuilder.then = vi.fn((resolve) =>
      resolve({
        data: [
          {
            id: VALID_VARIANT_ID_1,
            stock: 10,
            price_override: null,
            size: 'M',
            color: 'Negro',
            products: null, // <- JOIN falló o producto fue eliminado
          },
        ],
        error: null,
      })
    )

    const result = await checkout(
      {},
      buildCheckoutFormData({
        items: [{ variantId: VALID_VARIANT_ID_1, quantity: 1 }],
        customer: VALID_CUSTOMER,
      })
    )

    expect(result).toEqual({
      error: 'STOCK_INSUFFICIENT',
      failedItems: [VALID_VARIANT_ID_1],
    })
    expect(ordersBuilder.insert).not.toHaveBeenCalled()
  })

  // ── Errores en creación de orden ─────────────────────────────────────

  it('❌ Error al crear orden (Supabase error) → "Error al crear la orden"', async () => {
    // Variantes OK
    variantsBuilder.then = vi.fn((resolve) =>
      resolve({
        data: [
          {
            id: VALID_VARIANT_ID_1,
            stock: 5,
            price_override: null,
            size: 'S',
            color: 'Verde',
            products: { name: 'Polo', base_price: 12990 },
          },
        ],
        error: null,
      })
    )

    // Order insert falla
    ordersBuilder.single.mockResolvedValue({
      data: null,
      error: { message: 'Constraint violation' },
    })

    const result = await checkout(
      {},
      buildCheckoutFormData({
        items: [{ variantId: VALID_VARIANT_ID_1, quantity: 2 }],
        customer: VALID_CUSTOMER,
      })
    )

    expect(result).toEqual({ error: 'Error al crear la orden' })
    expect(orderItemsBuilder.insert).not.toHaveBeenCalled()
    expect(createPreference).not.toHaveBeenCalled()
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('❌ Order insert retorna null data sin error → "Error al crear la orden"', async () => {
    variantsBuilder.then = vi.fn((resolve) =>
      resolve({
        data: [
          {
            id: VALID_VARIANT_ID_1,
            stock: 5,
            price_override: 1000,
            size: 'XS',
            color: 'Rosa',
            products: { name: 'Remera', base_price: 8000 },
          },
        ],
        error: null,
      })
    )

    ordersBuilder.single.mockResolvedValue({
      data: null,
      error: null,
    })

    const result = await checkout(
      {},
      buildCheckoutFormData({
        items: [{ variantId: VALID_VARIANT_ID_1, quantity: 1 }],
        customer: VALID_CUSTOMER,
      })
    )

    expect(result).toEqual({ error: 'Error al crear la orden' })
  })

  // ── Catch block / error genérico ────────────────────────────────────

  it('❌ excepción inesperada → "Error interno del servidor"', async () => {
    variantsBuilder.in.mockImplementation(() => {
      throw new Error('Redis connection failed')
    })

    const result = await checkout(
      {},
      buildCheckoutFormData({
        items: [{ variantId: VALID_VARIANT_ID_1, quantity: 1 }],
        customer: VALID_CUSTOMER,
      })
    )

    expect(result).toEqual({ error: 'Error interno del servidor' })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  // ── Edge: múltiples items OK ────────────────────────────────────────

  it('múltiples items válidos → total_amount calculado correctamente', async () => {
    variantsBuilder.then = vi.fn((resolve) =>
      resolve({
        data: [
          {
            id: VALID_VARIANT_ID_1,
            stock: 10,
            price_override: null,
            size: 'M',
            color: 'Negro',
            products: { name: 'Camiseta', base_price: 10000 },
          },
          {
            id: VALID_VARIANT_ID_2,
            stock: 10,
            price_override: 15000,
            size: 'L',
            color: 'Blanco',
            products: { name: 'Poleron', base_price: 20000 },
          },
        ],
        error: null,
      })
    )

    ordersBuilder.single.mockResolvedValue({
      data: { id: 'order-multi' },
      error: null,
    })

    // 2x Camiseta @10000 + 3x Poleron @15000 (override)
    // = 20000 + 45000 = 65000
    await checkout(
      {},
      buildCheckoutFormData({
        items: [
          { variantId: VALID_VARIANT_ID_1, quantity: 2 },
          { variantId: VALID_VARIANT_ID_2, quantity: 3 },
        ],
        customer: VALID_CUSTOMER,
      })
    )

    expect(ordersBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        total_amount: 2 * 10000 + 3 * 15000,
      })
    )
  })
})
