import { getProductImageUrl, imagePresets } from '@/lib/images'

const STORAGE_BASE =
  'https://xekmbpnoliklniomhopl.supabase.co/storage/v1/object/public/product-images'

describe('getProductImageUrl', () => {
  it('generates a URL with the object public endpoint', () => {
    const url = getProductImageUrl('tshirt.jpg')
    expect(url).toBe(`${STORAGE_BASE}/tshirt.jpg`)
  })

  it('handles paths with subdirectories', () => {
    const url = getProductImageUrl('polera-negra-minimal/front.svg')
    expect(url).toBe(`${STORAGE_BASE}/polera-negra-minimal/front.svg`)
  })

  it('handles paths with special characters', () => {
    const url = getProductImageUrl('camiseta_2025_v2.png')
    expect(url).toContain('camiseta_2025_v2.png')
  })

  it('does not add query parameters (image transforms not available)', () => {
    const url = getProductImageUrl('tshirt.jpg')
    expect(url).not.toContain('?')
    expect(url).not.toContain('width=')
    expect(url).not.toContain('quality=')
    expect(url).not.toContain('format=')
  })

  it('uses the correct Supabase project URL', () => {
    const url = getProductImageUrl('tshirt.jpg')
    expect(url).toContain('xekmbpnoliklniomhopl.supabase.co')
    expect(url).toContain('/storage/v1/object/public/product-images/')
  })
})

describe('imagePresets', () => {
  it('each preset returns the same URL as getProductImageUrl', () => {
    const path = 'product.jpg'
    const base = getProductImageUrl(path)
    expect(imagePresets.thumbnail(path)).toBe(base)
    expect(imagePresets.card(path)).toBe(base)
    expect(imagePresets.detail(path)).toBe(base)
    expect(imagePresets.adminThumb(path)).toBe(base)
  })

  it('each preset preserves the storage path', () => {
    const path = 'polera-negra.jpg'
    expect(imagePresets.thumbnail(path)).toContain(path)
    expect(imagePresets.card(path)).toContain(path)
    expect(imagePresets.detail(path)).toContain(path)
    expect(imagePresets.adminThumb(path)).toContain(path)
  })

  it('all presets use the object public endpoint', () => {
    const path = 'img.svg'
    expect(imagePresets.thumbnail(path)).toContain(
      '/storage/v1/object/public/product-images/'
    )
    expect(imagePresets.card(path)).toContain(
      '/storage/v1/object/public/product-images/'
    )
    expect(imagePresets.detail(path)).toContain(
      '/storage/v1/object/public/product-images/'
    )
    expect(imagePresets.adminThumb(path)).toContain(
      '/storage/v1/object/public/product-images/'
    )
  })
})
