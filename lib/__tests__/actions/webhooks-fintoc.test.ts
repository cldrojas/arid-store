import { describe, it, expect, vi, beforeEach } from 'vitest'

// =====================
// Hoisted mocks
// =====================
const mockVerifyHeader = vi.hoisted(() => vi.fn())
const mockWebhookSignatureError = vi.hoisted(() => {
  return class MockWebhookSignatureError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'WebhookSignatureError'
    }
  }
})

const mockSendOrderConfirmation = vi.hoisted(() => vi.fn())

vi.mock('fintoc', () => ({
  WebhookSignature: { verifyHeader: mockVerifyHeader },
  WebhookSignatureError: mockWebhookSignatureError
}))

const supabaseChain = vi.hoisted(() => {
  const builder = {
    from: vi.fn(() => builder),
    select: vi.fn(() => builder),
    in: vi.fn(() => Promise.resolve({ data: null as any, error: null as any })),
    eq: vi.fn(() => builder as any),
    single: vi.fn(() => Promise.resolve({ data: null as any, error: null as any })),
    insert: vi.fn(() => builder as any),
    update: vi.fn(() => builder),
    order: vi.fn(() => builder),
    rpc: vi.fn(() => Promise.resolve({ data: null as any, error: null as any })),
    then: function (resolve: (value: unknown) => unknown) {
      return Promise.resolve({ data: null, error: null }).then(resolve)
    }
  }
  return builder
})

vi.mock('@/lib/resend', () => ({
  sendOrderConfirmation: mockSendOrderConfirmation
}))

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: () => supabaseChain
}))

// =====================
// Import after mocks
// =====================
import { POST } from '@/app/api/webhooks/fintoc/route'

function createWebhookEvent(type: string, overrides: Record<string, any> = {}) {
  return {
    type,
    data: {
      id: 'pi_test_123',
      object: 'payment_intent',
      amount: 50000,
      status: type === 'payment_intent.failed' ? 'failed' : 'succeeded',
      metadata: {
        order_id: 'order-123'
      },
      ...overrides
    }
  }
}

function createRequest(body: any, options: { includeSignature?: boolean } = {}): Request {
  const { includeSignature = true } = options
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (includeSignature) {
    headers['fintoc-signature'] = 't=1717000000,v1=test_signature_hex'
  }
  return new Request('https://arid-store.vercel.app/api/webhooks/fintoc', {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  })
}

// Helper helpers that create { data, error } shapes matching Supabase responses
const db = {
  row: (data: any) => ({ data, error: null }),
  rows: (data: any[]) => ({ data, error: null }),
  empty: () => ({ data: null, error: null }),
}

const pendingOrder = db.row({
  id: 'order-123',
  status: 'pending' as const,
  payment_intent_id: null,
  customer_email: 'juan@ejemplo.com'
})

const fullOrderResult = db.row({
  id: 'order-123',
  status: 'approved' as const,
  total_amount: 50000,
  customer_email: 'juan@ejemplo.com',
  customer_name: 'Juan Pérez',
  items: [
    { id: 'item-1', product_name: 'Polera', quantity: 2, unit_price: 15000 }
  ]
})

const orderItemsResult = db.rows([
  { variant_id: 'variant-1', quantity: 2 },
  { variant_id: 'variant-2', quantity: 1 }
])

describe('Webhook Fintoc', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyHeader.mockReturnValue(undefined) // éxito por defecto

    // Restore chain defaults
    supabaseChain.from.mockReturnValue(supabaseChain)
    supabaseChain.select.mockReturnValue(supabaseChain)
    supabaseChain.in.mockReturnValue(Promise.resolve(db.empty()) as any)
    supabaseChain.eq.mockReturnValue(supabaseChain as any)
    supabaseChain.single.mockResolvedValue(db.empty())
    supabaseChain.insert.mockReturnValue(supabaseChain as any)
    supabaseChain.update.mockReturnValue(supabaseChain)
    supabaseChain.order.mockReturnValue(supabaseChain)
    supabaseChain.rpc.mockResolvedValue(db.empty())

    mockSendOrderConfirmation.mockResolvedValue(undefined)
  })

  describe('checkout_session.finished / payment_intent.succeeded', () => {
    function setupApprovedFlow() {
      supabaseChain.single
        .mockResolvedValueOnce(pendingOrder)
        .mockResolvedValueOnce(fullOrderResult)

      supabaseChain.eq
        .mockReturnValueOnce(supabaseChain as any)                                      // 1: select().eq() → single
        .mockReturnValueOnce(supabaseChain as any)                                      // 2: update().eq() → terminal
        .mockReturnValueOnce(Promise.resolve(orderItemsResult) as any)                  // 3: select().eq() → items
        .mockReturnValueOnce(supabaseChain as any)                                      // 4: select().eq() → single
    }

    it('debería procesar checkout_session.finished y aprobar la orden', async () => {
      setupApprovedFlow()

      const req = createRequest(createWebhookEvent('checkout_session.finished'))
      const res = await POST(req)
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body).toEqual({ ok: true })

      expect(supabaseChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'approved',
          payment_intent_id: 'pi_test_123'
        })
      )

      expect(supabaseChain.rpc).toHaveBeenCalledWith('decrement_stock', {
        p_variant_id: 'variant-1',
        p_quantity: 2
      })
      expect(supabaseChain.rpc).toHaveBeenCalledWith('decrement_stock', {
        p_variant_id: 'variant-2',
        p_quantity: 1
      })

      expect(mockSendOrderConfirmation).toHaveBeenCalled()
    })

    it('debería procesar payment_intent.succeeded y aprobar la orden', async () => {
      setupApprovedFlow()

      const req = createRequest(createWebhookEvent('payment_intent.succeeded'))
      const res = await POST(req)
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body).toEqual({ ok: true })

      expect(supabaseChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'approved',
          payment_intent_id: 'pi_test_123'
        })
      )

      expect(supabaseChain.rpc).toHaveBeenCalled()
      expect(mockSendOrderConfirmation).toHaveBeenCalled()
    })

    it('debería actualizar metadata con el payload del evento', async () => {
      setupApprovedFlow()

      const event = createWebhookEvent('checkout_session.finished')
      const req = createRequest(event)
      await POST(req)

      expect(supabaseChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: event.data
        })
      )
    })
  })

  describe('payment_intent.failed', () => {
    it('debería rechazar la orden', async () => {
      supabaseChain.single.mockResolvedValueOnce(pendingOrder)

      supabaseChain.eq
        .mockReturnValueOnce(supabaseChain as any)  // 1: select().eq() → single
        .mockReturnValueOnce(supabaseChain as any)  // 2: update().eq() → terminal

      const req = createRequest(createWebhookEvent('payment_intent.failed'))
      const res = await POST(req)

      expect(res.status).toBe(200)

      expect(supabaseChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'rejected',
          payment_intent_id: 'pi_test_123'
        })
      )

      expect(supabaseChain.rpc).not.toHaveBeenCalled()
      expect(mockSendOrderConfirmation).not.toHaveBeenCalled()
    })
  })

  describe('idempotencia', () => {
    it('debería ser idempotente si ya tiene el mismo payment_intent_id', async () => {
      const approvedOrder = db.row({
        id: 'order-123',
        status: 'approved' as const,
        payment_intent_id: 'pi_test_123',
        customer_email: 'juan@ejemplo.com'
      })
      supabaseChain.single.mockResolvedValueOnce(approvedOrder)
      supabaseChain.eq.mockReturnValueOnce(supabaseChain as any)

      const req = createRequest(createWebhookEvent('checkout_session.finished'))
      const res = await POST(req)
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body).toEqual({ ok: true })

      expect(supabaseChain.update).not.toHaveBeenCalled()
      expect(supabaseChain.rpc).not.toHaveBeenCalled()
      expect(mockSendOrderConfirmation).not.toHaveBeenCalled()
    })
  })

  describe('casos borde', () => {
    it('debería retornar 200 si order_id no existe', async () => {
      supabaseChain.single.mockResolvedValueOnce(db.empty())
      supabaseChain.eq.mockReturnValueOnce(supabaseChain as any)

      const req = createRequest(createWebhookEvent('checkout_session.finished'))
      const res = await POST(req)
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body).toEqual({ ok: true })

      expect(supabaseChain.update).not.toHaveBeenCalled()
      expect(supabaseChain.rpc).not.toHaveBeenCalled()
      expect(mockSendOrderConfirmation).not.toHaveBeenCalled()
    })

    it('debería retornar 200 si payload está malformado (sin order_id)', async () => {
      const event = createWebhookEvent('checkout_session.finished')
      event.data.metadata = {} as any

      const req = createRequest(event)
      const res = await POST(req)
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body).toEqual({ ok: true })

      expect(supabaseChain.from).not.toHaveBeenCalled()
    })

    it('debería retornar 200 si payload está malformado (sin data.id)', async () => {
      const event = createWebhookEvent('checkout_session.finished')
      event.data.id = ''

      const req = createRequest(event)
      const res = await POST(req)
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body).toEqual({ ok: true })

      expect(supabaseChain.from).not.toHaveBeenCalled()
    })

    it('debería retornar 200 para tipos de evento no soportados', async () => {
      const req = createRequest({ type: 'ping', data: {} })
      const res = await POST(req)
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body).toEqual({ ok: true })

      expect(supabaseChain.from).not.toHaveBeenCalled()
    })

    it('debería manejar errores no controlados sin crash', async () => {
      supabaseChain.single.mockRejectedValueOnce(new Error('DB connection error'))
      supabaseChain.eq.mockReturnValueOnce(supabaseChain as any)

      const req = createRequest(createWebhookEvent('checkout_session.finished'))
      const res = await POST(req)
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body).toEqual({ ok: true })
    })
  })

  describe('verificación de firma', () => {
    it('debería rechazar webhook con firma inválida (401)', async () => {
      mockVerifyHeader.mockImplementationOnce(() => {
        throw new mockWebhookSignatureError('Invalid signature')
      })

      const req = createRequest(createWebhookEvent('checkout_session.finished'))
      const res = await POST(req)
      const body = await res.json()

      expect(res.status).toBe(401)
      expect(body).toEqual({ error: 'Invalid signature' })
      expect(supabaseChain.from).not.toHaveBeenCalled()
    })

    it('debería aceptar webhook sin header de firma (200 con warning)', async () => {
      const req = createRequest(createWebhookEvent('checkout_session.finished'), { includeSignature: false })
      const res = await POST(req)
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body).toEqual({ ok: true })
      expect(supabaseChain.from).not.toHaveBeenCalled()
    })

    it('debería verificar firma antes de procesar evento válido', async () => {
      supabaseChain.single.mockResolvedValueOnce(pendingOrder)
      supabaseChain.eq
        .mockReturnValueOnce(supabaseChain as any)
        .mockReturnValueOnce(supabaseChain as any)

      const event = createWebhookEvent('payment_intent.failed')
      const req = createRequest(event)
      await POST(req)

      expect(mockVerifyHeader).toHaveBeenCalledOnce()
      expect(supabaseChain.update).toHaveBeenCalled()
    })
  })
})
