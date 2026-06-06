import { render, screen, fireEvent } from '@/lib/__tests__/test-utils'
import { ProductGallery } from '@/components/store/ProductGallery'
import type { ProductImage } from '@/types'

function makeImage(overrides: Partial<ProductImage> & { id: string }): ProductImage {
  return {
    product_id: 'prod-1',
    variant_id: null,
    storage_path: `products/${overrides.id}.jpg`,
    alt_text: null,
    sort_order: 0,
    is_primary: false,
    ...overrides,
  }
}

const singleImage: ProductImage[] = [
  makeImage({ id: 'img-1', alt_text: 'Vista frontal', sort_order: 1, is_primary: true }),
]

const multipleImages: ProductImage[] = [
  makeImage({ id: 'img-1', alt_text: 'Vista frontal', sort_order: 1, is_primary: true }),
  makeImage({ id: 'img-2', alt_text: 'Vista trasera', sort_order: 2 }),
  makeImage({ id: 'img-3', alt_text: 'Detalle', sort_order: 3 }),
]

describe('ProductGallery', () => {
  it('shows "Sin imagen" when images array is empty', () => {
    render(<ProductGallery images={[]} />)

    expect(screen.getByText('Sin imagen')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('renders main image with correct alt text', () => {
    render(<ProductGallery images={singleImage} />)

    const mainImg = screen.getByAltText('Vista frontal')
    expect(mainImg).toBeInTheDocument()
    expect(mainImg).toHaveAttribute('src')
  })

  it('uses default alt text when alt_text is null', () => {
    const imagesWithoutAlt = [
      makeImage({ id: 'img-1', alt_text: null, sort_order: 1 }),
    ]

    render(<ProductGallery images={imagesWithoutAlt} />)

    const mainImg = screen.getByAltText('Imagen del producto')
    expect(mainImg).toBeInTheDocument()
  })

  it('sorts images by sort_order', () => {
    const unsortedImages = [
      makeImage({ id: 'img-3', alt_text: 'Tercera', sort_order: 3 }),
      makeImage({ id: 'img-1', alt_text: 'Primera', sort_order: 1 }),
      makeImage({ id: 'img-2', alt_text: 'Segunda', sort_order: 2 }),
    ]

    render(<ProductGallery images={unsortedImages} />)

    // Main image is the first img in the gallery (before thumbnail buttons)
    const mainImg = screen.getAllByRole('img')[0]
    expect(mainImg).toHaveAttribute('alt', 'Primera')
  })

  it('does not render thumbnails when there is only one image', () => {
    render(<ProductGallery images={singleImage} />)

    // Only one img: the main one. No thumbnail buttons.
    const imgs = screen.getAllByRole('img')
    expect(imgs).toHaveLength(1)
  })

  it('renders thumbnails when there are multiple images', () => {
    render(<ProductGallery images={multipleImages} />)

    // Main image + 3 thumbnails = 4 images
    const imgs = screen.getAllByRole('img')
    expect(imgs).toHaveLength(4)
  })

  it('clicking a thumbnail changes the selected image', () => {
    render(<ProductGallery images={multipleImages} />)

    // Main image is the first img in the gallery
    function getMainImageAlt(): string | null {
      return screen.getAllByRole('img')[0]?.getAttribute('alt') ?? null
    }

    // Initially the main image shows "Vista frontal"
    expect(getMainImageAlt()).toBe('Vista frontal')

    // Click the second thumbnail (index 1)
    const thumbnails = screen.getAllByRole('button')
    expect(thumbnails).toHaveLength(3)

    fireEvent.click(thumbnails[1])

    // Now the main image should show "Vista trasera"
    expect(getMainImageAlt()).toBe('Vista trasera')
  })

  it('highlights the active thumbnail with border-accent', () => {
    render(<ProductGallery images={multipleImages} />)

    const thumbnails = screen.getAllByRole('button')

    // First thumbnail should be active initially
    expect(thumbnails[0]).toHaveClass('border-accent')
    expect(thumbnails[1]).toHaveClass('border-transparent')

    // Click the second thumbnail
    fireEvent.click(thumbnails[1])

    // Now second should be active
    expect(thumbnails[0]).toHaveClass('border-transparent')
    expect(thumbnails[1]).toHaveClass('border-accent')
  })

  it('generates image URLs with object public endpoint', () => {
    render(<ProductGallery images={multipleImages} />)

    const imgs = screen.getAllByRole('img')

    // All images use the object public storage endpoint
    imgs.forEach(img => {
      const src = img.getAttribute('src') ?? ''
      expect(src).toContain('/storage/v1/object/public/product-images/')
    })

    // Main image points to first sorted image
    expect(imgs[0].getAttribute('src')).toContain('img-1.jpg')
    // Thumbnails also point to their respective images
    expect(imgs[1].getAttribute('src')).toContain('img-1.jpg')
  })
})
