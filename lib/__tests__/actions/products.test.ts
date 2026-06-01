vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(),
}))

import { createAdminClient } from '@/lib/supabase/server'
import {
  createProduct,
  updateProduct,
  toggleProductActive,
} from '@/lib/actions/products'
import { revalidateTag } from 'next/cache'

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
    // The builder is thenable so `await builder` delegates to .then()
    then: vi.fn((resolve: (v: unknown) => void) => resolve(resolveValue)),
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function buildFormData(payload: Record<string, unknown>): FormData {
  const fd = new FormData()
  fd.append('data', JSON.stringify(payload))
  return fd
}

describe('createProduct', () => {
  let productsBuilder: MockBuilder
  let variantsBuilder: MockBuilder
  let imagesBuilder: MockBuilder

  beforeEach(() => {
    vi.clearAllMocks()

    productsBuilder = createMockBuilder()
    variantsBuilder = createMockBuilder()
    imagesBuilder = createMockBuilder()

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'products') return productsBuilder
        if (table === 'product_variants') return variantsBuilder
        if (table === 'product_images') return imagesBuilder
        return createMockBuilder()
      }),
    } as never)
  })

  // ── Happy path ──────────────────────────────────────────────────────

  it('creates product with variants and images → success true', async () => {
    productsBuilder.single.mockResolvedValue({
      data: { id: 'prod-1' },
      error: null,
    })

    const result = await createProduct(
      {},
      buildFormData({
        name: 'Camiseta Negra',
        slug: 'camiseta-negra',
        description: 'Algodón 100%',
        base_price: 15990,
        is_active: true,
        variants: [
          {
            size: 'M',
            color: 'Negro',
            color_hex: '#000',
            stock: 10,
            sku: 'CS-M-N',
            price_override: null,
          },
          {
            size: 'L',
            color: 'Negro',
            color_hex: '#000',
            stock: 5,
            sku: 'CS-L-N',
            price_override: null,
          },
        ],
        images: [
          {
            storage_path: 'products/camiseta-1.jpg',
            alt_text: 'Vista frontal',
            sort_order: 0,
            is_primary: true,
          },
        ],
      })
    )

    expect(result).toEqual({ success: true })

    // Product insert
    expect(productsBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Camiseta Negra',
        slug: 'camiseta-negra',
        base_price: 15990,
        is_active: true,
      })
    )
    expect(productsBuilder.select).toHaveBeenCalledWith('id')
    expect(productsBuilder.single).toHaveBeenCalled()

    // Variants insert
    expect(variantsBuilder.insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          product_id: 'prod-1',
          size: 'M',
          color: 'Negro',
          stock: 10,
        }),
        expect.objectContaining({
          product_id: 'prod-1',
          size: 'L',
          color: 'Negro',
          stock: 5,
        }),
      ])
    )

    // Images insert
    expect(imagesBuilder.insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          product_id: 'prod-1',
          storage_path: 'products/camiseta-1.jpg',
          is_primary: true,
        }),
      ])
    )

    expect(revalidateTag).toHaveBeenCalledWith('products', { expire: 0 })
  })

  // ── Errors ──────────────────────────────────────────────────────────

  it('returns error when supabase product insert fails', async () => {
    productsBuilder.single.mockResolvedValue({
      data: null,
      error: { message: 'llave duplicada' },
    })

    const result = await createProduct(
      {},
      buildFormData({ name: 'Fail', slug: 'fail', base_price: 5000 })
    )

    expect(result).toEqual({ error: 'llave duplicada' })
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('returns error when product insert returns no data', async () => {
    productsBuilder.single.mockResolvedValue({
      data: null,
      error: null,
    })

    const result = await createProduct(
      {},
      buildFormData({ name: 'Nodata', slug: 'nodata', base_price: 5000 })
    )

    expect(result).toEqual({ error: 'Error al crear producto' })
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('returns error when variants insert fails', async () => {
    productsBuilder.single.mockResolvedValue({
      data: { id: 'prod-2' },
      error: null,
    })
    variantsBuilder.then = vi.fn((resolve) =>
      resolve({ data: null, error: { message: 'variant error' } })
    )

    const result = await createProduct(
      {},
      buildFormData({
        name: 'VarFail',
        slug: 'var-fail',
        base_price: 5000,
        variants: [{ size: 'M', color: 'Rojo', stock: 3 }],
      })
    )

    expect(result).toEqual({ error: 'variant error' })
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('returns error when images insert fails', async () => {
    productsBuilder.single.mockResolvedValue({
      data: { id: 'prod-3' },
      error: null,
    })
    imagesBuilder.then = vi.fn((resolve) =>
      resolve({ data: null, error: { message: 'img error' } })
    )

    const result = await createProduct(
      {},
      buildFormData({
        name: 'ImgFail',
        slug: 'img-fail',
        base_price: 5000,
        images: [
          {
            storage_path: 'products/x.jpg',
            alt_text: null,
            sort_order: 0,
            is_primary: false,
          },
        ],
      })
    )

    expect(result).toEqual({ error: 'img error' })
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('returns error for invalid JSON in formData', async () => {
    const fd = new FormData()
    fd.append('data', 'not-valid-json')

    const result = await createProduct({}, fd)

    expect(result).toHaveProperty('error')
    // Should not reach any supabase call
    expect(productsBuilder.insert).not.toHaveBeenCalled()
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  // ── Edge: no variants / no images ───────────────────────────────────

  it('creates product without variants', async () => {
    productsBuilder.single.mockResolvedValue({
      data: { id: 'prod-4' },
      error: null,
    })

    const result = await createProduct(
      {},
      buildFormData({
        name: 'Solo Img',
        slug: 'solo-img',
        base_price: 10000,
        variants: [],
        images: [
          {
            storage_path: 'products/foto.jpg',
            alt_text: null,
            sort_order: 0,
            is_primary: true,
          },
        ],
      })
    )

    expect(result).toEqual({ success: true })
    expect(productsBuilder.insert).toHaveBeenCalled()
    expect(variantsBuilder.insert).not.toHaveBeenCalled()
    expect(imagesBuilder.insert).toHaveBeenCalled()
  })

  it('creates product without images', async () => {
    productsBuilder.single.mockResolvedValue({
      data: { id: 'prod-5' },
      error: null,
    })

    const result = await createProduct(
      {},
      buildFormData({
        name: 'Solo Var',
        slug: 'solo-var',
        base_price: 10000,
        variants: [{ size: 'S', color: 'Blanco', stock: 8 }],
        images: [],
      })
    )

    expect(result).toEqual({ success: true })
    expect(productsBuilder.insert).toHaveBeenCalled()
    expect(variantsBuilder.insert).toHaveBeenCalled()
    expect(imagesBuilder.insert).not.toHaveBeenCalled()
  })

  it('creates product with nullish variants / images arrays', async () => {
    productsBuilder.single.mockResolvedValue({
      data: { id: 'prod-6' },
      error: null,
    })

    const result = await createProduct(
      {},
      buildFormData({
        name: 'Nullish',
        slug: 'nullish',
        base_price: 10000,
      })
    )

    expect(result).toEqual({ success: true })
    expect(variantsBuilder.insert).not.toHaveBeenCalled()
    expect(imagesBuilder.insert).not.toHaveBeenCalled()
  })
})

// -----------------------------------------------------------------------
// updateProduct
// -----------------------------------------------------------------------
describe('updateProduct', () => {
  let productsBuilder: MockBuilder
  let variantsBuilder: MockBuilder
  let imagesBuilder: MockBuilder

  beforeEach(() => {
    vi.clearAllMocks()

    productsBuilder = createMockBuilder()
    variantsBuilder = createMockBuilder()
    imagesBuilder = createMockBuilder()

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'products') return productsBuilder
        if (table === 'product_variants') return variantsBuilder
        if (table === 'product_images') return imagesBuilder
        return createMockBuilder()
      }),
    } as never)
  })

  it('updates product and replaces variants + images → success true', async () => {
    // Everything resolves with no error by default
    const result = await updateProduct(
      {},
      buildFormData({
        id: 'prod-1',
        name: 'Updated',
        slug: 'updated',
        description: null,
        base_price: 19990,
        is_active: true,
        variants: [{ size: 'M', color: 'Azul', stock: 7 }],
        images: [
          {
            storage_path: 'products/new.jpg',
            alt_text: null,
            sort_order: 0,
            is_primary: true,
          },
        ],
      })
    )

    expect(result).toEqual({ success: true })

    // Product update
    expect(productsBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Updated', slug: 'updated' })
    )
    expect(productsBuilder.eq).toHaveBeenCalledWith('id', 'prod-1')

    // Variants: delete old + insert new
    expect(variantsBuilder.delete).toHaveBeenCalled()
    expect(variantsBuilder.insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ product_id: 'prod-1', color: 'Azul' }),
      ])
    )

    // Images: delete old + insert new
    expect(imagesBuilder.delete).toHaveBeenCalled()
    expect(imagesBuilder.insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ product_id: 'prod-1' }),
      ])
    )

    expect(revalidateTag).toHaveBeenCalledWith('products', { expire: 0 })
  })

  it('calls delete before insert for both variants and images', async () => {
    const result = await updateProduct(
      {},
      buildFormData({
        id: 'prod-2',
        name: 'Order',
        slug: 'order',
        base_price: 10000,
        variants: [{ size: 'L', color: 'Verde', stock: 2 }],
        images: [
          {
            storage_path: 'products/order.jpg',
            alt_text: null,
            sort_order: 0,
            is_primary: true,
          },
        ],
      })
    )

    expect(result).toEqual({ success: true })

    // Global invocation order: delete must come before insert
    const deleteOrder = variantsBuilder.delete.mock.invocationCallOrder[0]
    const insertOrder = variantsBuilder.insert.mock.invocationCallOrder[0]
    expect(deleteOrder).toBeLessThan(insertOrder!)

    const imgDelOrder = imagesBuilder.delete.mock.invocationCallOrder[0]
    const imgInsOrder = imagesBuilder.insert.mock.invocationCallOrder[0]
    expect(imgDelOrder).toBeLessThan(imgInsOrder!)
  })

  it('returns error when product update fails', async () => {
    productsBuilder.then = vi.fn((resolve) =>
      resolve({ data: null, error: { message: 'update denied' } })
    )

    const result = await updateProduct(
      {},
      buildFormData({
        id: 'prod-x',
        name: 'Fail',
        slug: 'fail',
        base_price: 1000,
        variants: [],
        images: [],
      })
    )

    expect(result).toEqual({ error: 'update denied' })
    // Should not proceed to delete / insert
    expect(variantsBuilder.delete).not.toHaveBeenCalled()
    expect(imagesBuilder.delete).not.toHaveBeenCalled()
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('updates without variants or images (empty arrays)', async () => {
    const result = await updateProduct(
      {},
      buildFormData({
        id: 'prod-3',
        name: 'Clean',
        slug: 'clean',
        base_price: 5000,
        variants: [],
        images: [],
      })
    )

    expect(result).toEqual({ success: true })
    expect(productsBuilder.update).toHaveBeenCalled()
    // delete should still be called (action always deletes first)
    expect(variantsBuilder.delete).toHaveBeenCalled()
    expect(imagesBuilder.delete).toHaveBeenCalled()
    // insert should NOT be called because arrays are empty
    expect(variantsBuilder.insert).not.toHaveBeenCalled()
    expect(imagesBuilder.insert).not.toHaveBeenCalled()
  })
})

// -----------------------------------------------------------------------
// toggleProductActive
// -----------------------------------------------------------------------
describe('toggleProductActive', () => {
  let builder: MockBuilder

  beforeEach(() => {
    vi.clearAllMocks()

    builder = createMockBuilder()

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => builder),
    } as never)
  })

  it('activates product → success true', async () => {
    const fd = new FormData()
    fd.append('id', 'prod-1')
    fd.append('is_active', 'true')

    const result = await toggleProductActive({}, fd)

    expect(result).toEqual({ success: true })
    expect(builder.update).toHaveBeenCalledWith({ is_active: true })
    expect(builder.eq).toHaveBeenCalledWith('id', 'prod-1')
    expect(revalidateTag).toHaveBeenCalledWith('products', { expire: 0 })
  })

  it('deactivates product → success true', async () => {
    const fd = new FormData()
    fd.append('id', 'prod-2')
    fd.append('is_active', 'false')

    const result = await toggleProductActive({}, fd)

    expect(result).toEqual({ success: true })
    expect(builder.update).toHaveBeenCalledWith({ is_active: false })
    expect(builder.eq).toHaveBeenCalledWith('id', 'prod-2')
    expect(revalidateTag).toHaveBeenCalledWith('products', { expire: 0 })
  })

  it('returns error on supabase failure', async () => {
    builder.then = vi.fn((resolve) =>
      resolve({ data: null, error: { message: 'DB error' } })
    )

    const fd = new FormData()
    fd.append('id', 'prod-3')
    fd.append('is_active', 'true')

    const result = await toggleProductActive({}, fd)

    expect(result).toEqual({ error: 'DB error' })
    expect(revalidateTag).not.toHaveBeenCalled()
  })
})
