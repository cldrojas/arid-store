import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { CheckoutPayload, CheckoutResponse } from '@/types'

// =====================
// Hoisted mocks
// =====================
const mockCreateCheckoutSession = vi.hoisted(() => vi.fn())

const supabaseChain = vi.hoisted(() => {
  const terminalResult = { data: null as any, error: null as any }

  const builder = {
    from: vi.fn(() => builder),
    select: vi.fn(() => builder),
    in: vi.fn(() => Promise.resolve({ ...terminalResult })),
    eq: vi.fn(() => builder as any),
    single: vi.fn(() => Promise.resolve({ ...terminalResult })),
    insert: vi.fn(() => builder as any),
    update: vi.fn(() => builder),
    order: vi.fn(() => builder),
    rpc: vi.fn(() => Promise.resolve({ ...terminalResult })),
    then: function (resolve: (value: unknown) => unknown) {
      return Promise.resolve({ ...terminalResult }).then(resolve)
    }
  }
  return builder
})

vi.mock('@/lib/fintoc', () => ({
  createCheckoutSession: mockCreateCheckoutSession
}))

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: () => supabaseChain
}))

// =====================
// Import after mocks
// =====================
import { checkoutAction } from '@/lib/actions/checkout'

const validPayload: CheckoutPayload = {
  items: [
    { variantId: 'variant-1', quantity: 2 },
    { variantId: 'variant-2', quantity: 1 }
  ],
  customer: {
    name: 'Juan Pérez',
    email: 'juan@ejemplo.com',
    phone: '+56912345678',
    address: {
      street: 'Av. Providencia 1234',
      city: 'Santiago',
      region: 'Metropolitana',
      zip: '7500000',
      notes: null
    }
  }
}

function mockVariants() {
  return [
    {
      id: 'variant-1',
      stock: 10,
      price_override: null,
      product_id: 'product-1',
      size: 'M' as const,
      color: 'Negro',
      products: { name: 'Polera Clásica', base_price: 15000 }
    },
    {
      id: 'variant-2',
      stock: 5,
      price_override: 20000,
      product_id: 'product-2',
      size: 'L' as const,
      color: 'Blanco',
      products: { name: 'Polera Premium', base_price: 18000 }
    }
  ]
}

describe('checkoutAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Restore chain defaults after clearAllMocks
    supabaseChain.from.mockReturnValue(supabaseChain)
    supabaseChain.select.mockReturnValue(supabaseChain)
    supabaseChain.in.mockReturnValue(Promise.resolve({ data: null, error: null }) as any)
    supabaseChain.eq.mockReturnValue(supabaseChain as any)
    supabaseChain.single.mockResolvedValue({ data: null, error: null })
    supabaseChain.insert.mockReturnValue(supabaseChain as any)
    supabaseChain.update.mockReturnValue(supabaseChain)
    supabaseChain.order.mockReturnValue(supabaseChain)
    supabaseChain.rpc.mockResolvedValue({ data: null, error: null })

    mockCreateCheckoutSession.mockResolvedValue({
      sessionId: 'cs_test_123',
      redirectUrl: 'https://checkout.fintoc.com/pay/cs_test_123'
    })
  })

  it('debería crear orden y checkout session exitosamente', async () => {
    supabaseChain.in.mockResolvedValue({ data: mockVariants(), error: null })
    supabaseChain.single.mockResolvedValue({ data: { id: 'order-123' }, error: null })

    const result = await checkoutAction(null, validPayload)

    expect(result).toEqual({
      redirectUrl: 'https://checkout.fintoc.com/pay/cs_test_123'
    })

    expect(mockCreateCheckoutSession).toHaveBeenCalledWith({
      orderId: 'order-123',
      amount: 50000,
      customerEmail: 'juan@ejemplo.com',
      baseUrl: expect.any(String),
    })

    expect(supabaseChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ payment_session_id: 'cs_test_123' })
    )
  })

  it('debería retornar error si faltan datos obligatorios', async () => {
    const invalidPayload: CheckoutPayload = {
      items: [],
      customer: { name: '', email: '', phone: '', address: {} as any }
    }

    const result = await checkoutAction(null, invalidPayload)

    expect(result).toEqual({
      error: 'VALIDATION_ERROR',
      message: 'Datos incompletos'
    })

    expect(mockCreateCheckoutSession).not.toHaveBeenCalled()
  })

  it('debería retornar INSUFFICIENT_STOCK si no hay stock', async () => {
    const variants = mockVariants()
    variants[0].stock = 1
    supabaseChain.in.mockResolvedValue({ data: variants as any, error: null })

    const result = await checkoutAction(null, validPayload)

    expect(result).toEqual({
      error: 'INSUFFICIENT_STOCK',
      failedItems: ['variant-1']
    })

    expect(mockCreateCheckoutSession).not.toHaveBeenCalled()
  })

  it('debería retornar INSUFFICIENT_STOCK si variant no existe', async () => {
    const variants = mockVariants()
    supabaseChain.in.mockResolvedValue({
      data: [variants[1]] as any,
      error: null
    })

    const result = await checkoutAction(null, validPayload)

    expect(result).toEqual({
      error: 'INSUFFICIENT_STOCK',
      failedItems: ['variant-1']
    })

    expect(mockCreateCheckoutSession).not.toHaveBeenCalled()
  })

  it('debería retornar VALIDATION_ERROR si falla query de variants', async () => {
    supabaseChain.in.mockResolvedValue({ data: null, error: new Error('DB error') })

    const result = await checkoutAction(null, validPayload)

    expect(result).toEqual({
      error: 'VALIDATION_ERROR',
      message: 'Error al verificar productos'
    })

    expect(mockCreateCheckoutSession).not.toHaveBeenCalled()
  })

  it('debería retornar error si falla la creación de orden', async () => {
    supabaseChain.in.mockResolvedValue({ data: mockVariants() as any, error: null })
    supabaseChain.single.mockResolvedValue({ data: null, error: new Error('Insert error') })

    const result = await checkoutAction(null, validPayload)

    expect(result).toEqual({
      error: 'VALIDATION_ERROR',
      message: 'Error al crear la orden'
    })

    expect(mockCreateCheckoutSession).not.toHaveBeenCalled()
  })

  it('debería retornar error si Fintoc falla', async () => {
    supabaseChain.in.mockResolvedValue({ data: mockVariants() as any, error: null })
    supabaseChain.single.mockResolvedValue({ data: { id: 'order-123' }, error: null })
    mockCreateCheckoutSession.mockRejectedValue(new Error('Fintoc API error'))

    const result = await checkoutAction(null, validPayload)

    expect(result).toEqual({
      error: 'VALIDATION_ERROR',
      message: 'Error interno del servidor'
    })
  })

  it('debería usar price_override cuando existe', async () => {
    const variants = mockVariants()
    variants[0].price_override = 25000
    supabaseChain.in.mockResolvedValue({ data: variants as any, error: null })
    supabaseChain.single.mockResolvedValue({ data: { id: 'order-123' }, error: null })

    const payload: CheckoutPayload = {
      items: [{ variantId: 'variant-1', quantity: 1 }],
      customer: validPayload.customer
    }

    const result = await checkoutAction(null, payload)

    expect(result).toEqual({
      redirectUrl: 'https://checkout.fintoc.com/pay/cs_test_123'
    })

    expect(mockCreateCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 25000 })
    )
  })

  it('debería pasar todos los items al insert de order_items', async () => {
    supabaseChain.in.mockResolvedValue({ data: mockVariants() as any, error: null })
    supabaseChain.single.mockResolvedValue({ data: { id: 'order-123' }, error: null })

    await checkoutAction(null, validPayload)

    // El segundo insert es el de order_items
    const insertCalls = supabaseChain.insert.mock.calls as unknown as any[][]

    const orderItemsInsert = insertCalls.find(
      call => Array.isArray(call[0]) && call[0][0]?.variant_id
    )

    expect(orderItemsInsert).toBeDefined()
    expect(orderItemsInsert![0]).toEqual([
      expect.objectContaining({
        order_id: 'order-123',
        variant_id: 'variant-1',
        quantity: 2,
        unit_price: 15000
      }),
      expect.objectContaining({
        order_id: 'order-123',
        variant_id: 'variant-2',
        quantity: 1,
        unit_price: 20000
      })
    ])
  })

  it('debería preservar _prevState sin usarlo', async () => {
    supabaseChain.in.mockResolvedValue({ data: mockVariants() as any, error: null })
    supabaseChain.single.mockResolvedValue({ data: { id: 'order-123' }, error: null })

    const prevState: CheckoutResponse = { redirectUrl: 'https://previous.com' }
    const result = await checkoutAction(prevState, validPayload)

    expect(result).toEqual({
      redirectUrl: 'https://checkout.fintoc.com/pay/cs_test_123'
    })
  })
})
