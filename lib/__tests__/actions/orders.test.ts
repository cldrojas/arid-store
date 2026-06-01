vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(),
}))

import { createAdminClient } from '@/lib/supabase/server'
import { updateOrderStatus } from '@/lib/actions/orders'
import { revalidatePath } from 'next/cache'
import type { OrderStatus } from '@/types'

// ---------------------------------------------------------------------------
// Mock builder
// ---------------------------------------------------------------------------
interface MockBuilder {
  insert: ReturnType<typeof vi.fn>
  select: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
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
    then: vi.fn((resolve: (v: unknown) => void) => resolve(resolveValue)),
  }
}

// ---------------------------------------------------------------------------
// Shared helper
// ---------------------------------------------------------------------------
function buildStatusFormData(
  orderId: string,
  status: OrderStatus
): FormData {
  const fd = new FormData()
  fd.append('orderId', orderId)
  fd.append('status', status)
  return fd
}

describe('updateOrderStatus', () => {
  let builder: MockBuilder

  beforeEach(() => {
    vi.clearAllMocks()

    builder = createMockBuilder()

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => builder),
    } as never)
  })

  // ── Allowed transitions ─────────────────────────────────────────────

  it('transitions approved → shipped → success true', async () => {
    builder.single.mockResolvedValue({
      data: { status: 'approved' },
      error: null,
    })

    const result = await updateOrderStatus(
      {},
      buildStatusFormData('order-1', 'shipped')
    )

    expect(result).toEqual({ success: true })

    // Check fetch
    expect(builder.select).toHaveBeenCalledWith('status')
    expect(builder.eq).toHaveBeenCalledWith('id', 'order-1')
    expect(builder.single).toHaveBeenCalled()

    // Check update
    expect(builder.update).toHaveBeenCalledWith({ status: 'shipped' })
    expect(revalidatePath).toHaveBeenCalledWith('/admin/pedidos')
  })

  it('transitions shipped → delivered → success true', async () => {
    builder.single.mockResolvedValue({
      data: { status: 'shipped' },
      error: null,
    })

    const result = await updateOrderStatus(
      {},
      buildStatusFormData('order-2', 'delivered')
    )

    expect(result).toEqual({ success: true })
    expect(builder.update).toHaveBeenCalledWith({ status: 'delivered' })
    expect(revalidatePath).toHaveBeenCalledWith('/admin/pedidos')
  })

  // ── Invalid transitions ─────────────────────────────────────────────

  it('rejects pending → shipped as invalid', async () => {
    builder.single.mockResolvedValue({
      data: { status: 'pending' },
      error: null,
    })

    const result = await updateOrderStatus(
      {},
      buildStatusFormData('order-3', 'shipped')
    )

    expect(result).toEqual({
      error: 'No se puede cambiar de pending a shipped',
    })
    // Should not attempt the update
    expect(builder.update).not.toHaveBeenCalled()
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('rejects delivered → shipped as invalid', async () => {
    builder.single.mockResolvedValue({
      data: { status: 'delivered' },
      error: null,
    })

    const result = await updateOrderStatus(
      {},
      buildStatusFormData('order-4', 'shipped')
    )

    expect(result).toEqual({
      error: 'No se puede cambiar de delivered a shipped',
    })
    expect(builder.update).not.toHaveBeenCalled()
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('rejects approved → delivered as invalid (not in allowed list)', async () => {
    builder.single.mockResolvedValue({
      data: { status: 'approved' },
      error: null,
    })

    const result = await updateOrderStatus(
      {},
      buildStatusFormData('order-5', 'delivered')
    )

    expect(result).toEqual({
      error: 'No se puede cambiar de approved a delivered',
    })
    expect(builder.update).not.toHaveBeenCalled()
  })

  // ── Fetch errors ────────────────────────────────────────────────────

  it('returns error when order is not found', async () => {
    builder.single.mockResolvedValue({
      data: null,
      error: { message: 'Not found' },
    })

    const result = await updateOrderStatus(
      {},
      buildStatusFormData('order-notfound', 'shipped')
    )

    expect(result).toEqual({ error: 'Pedido no encontrado' })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('returns error when fetch returns null data without error', async () => {
    builder.single.mockResolvedValue({ data: null, error: null })

    const result = await updateOrderStatus(
      {},
      buildStatusFormData('order-null', 'shipped')
    )

    expect(result).toEqual({ error: 'Pedido no encontrado' })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  // ── Update error ────────────────────────────────────────────────────

  it('returns error when supabase update fails', async () => {
    builder.single.mockResolvedValue({
      data: { status: 'approved' },
      error: null,
    })
    builder.then = vi.fn((resolve) =>
      resolve({ data: null, error: { message: 'Update failed' } })
    )

    const result = await updateOrderStatus(
      {},
      buildStatusFormData('order-6', 'shipped')
    )

    expect(result).toEqual({ error: 'Update failed' })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  // ── Catch block ─────────────────────────────────────────────────────

  it('returns error when an unexpected exception is thrown', async () => {
    builder.single.mockImplementation(() => {
      throw new Error('Network error')
    })

    const result = await updateOrderStatus(
      {},
      buildStatusFormData('order-7', 'shipped')
    )

    expect(result).toEqual({ error: 'Network error' })
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
