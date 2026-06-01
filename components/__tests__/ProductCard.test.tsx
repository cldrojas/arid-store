import { render, screen } from '@/lib/__tests__/test-utils'
import { ProductCard } from '@/components/store/ProductCard'

const baseProduct = {
  id: 'prod-1',
  slug: 'polera-negra-minimal',
  name: 'Polera Negra Minimal',
  base_price: 12990,
}

describe('ProductCard', () => {
  it('renders product name and formatted price', () => {
    render(<ProductCard product={baseProduct} />)

    expect(screen.getByText('Polera Negra Minimal')).toBeInTheDocument()
    expect(screen.getByText(/\$12\.?990/)).toBeInTheDocument()
  })

  it('renders image when primary image exists', () => {
    const product = {
      ...baseProduct,
      images: [
        { storage_path: 'products/img-1.jpg', is_primary: true, sort_order: 0 },
      ],
    }

    render(<ProductCard product={product} />)

    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('alt', 'Polera Negra Minimal')
    expect(img).toHaveAttribute('src')
    expect(img!.getAttribute('src')).toContain('products/img-1.jpg')
  })

  it('uses first image when no primary image is set', () => {
    const product = {
      ...baseProduct,
      images: [
        { storage_path: 'products/img-2.jpg', is_primary: false, sort_order: 0 },
      ],
    }

    render(<ProductCard product={product} />)

    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()
    expect(img!.getAttribute('src')).toContain('products/img-2.jpg')
  })

  it('shows shirt skeleton when images array is empty', () => {
    const product = { ...baseProduct, images: [] }

    render(<ProductCard product={product} />)

    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', '/shirt-skeleton.svg')
  })

  it('shows shirt skeleton when images prop is undefined', () => {
    render(<ProductCard product={baseProduct} />)

    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', '/shirt-skeleton.svg')
  })

  it('links to /producto/{slug}', () => {
    render(<ProductCard product={baseProduct} />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/producto/polera-negra-minimal')
  })
})
