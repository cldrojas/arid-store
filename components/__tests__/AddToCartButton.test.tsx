import { render, screen, fireEvent } from '@/lib/__tests__/test-utils'
import { AddToCartButton } from '@/components/store/AddToCartButton'
import type { CartItem } from '@/types'

const { mockAddItem } = vi.hoisted(() => ({ mockAddItem: vi.fn() }))

vi.mock('@/context/CartContext', () => ({
  useCart: () => ({ addItem: mockAddItem }),
  CartProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const defaultProps = {
  variantId: 'var-123',
  productName: 'Polera Negra Minimal',
  variantDesc: 'Talla M',
  price: 12990,
  imageUrl: '/img.jpg',
  slug: 'polera-negra-minimal',
  stock: 10,
}

beforeEach(() => {
  mockAddItem.mockClear()
})

describe('AddToCartButton', () => {
  it('shows "Agregar al carrito" when stock > 0', () => {
    render(<AddToCartButton {...defaultProps} />)

    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('Agregar al carrito')
    expect(button).not.toBeDisabled()
  })

  it('shows "Sin stock" when stock is 0', () => {
    render(<AddToCartButton {...defaultProps} stock={0} />)

    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('Sin stock')
    expect(button).toBeDisabled()
  })

  it('calls addItem with correct payload when clicked', () => {
    render(<AddToCartButton {...defaultProps} />)

    fireEvent.click(screen.getByRole('button'))

    expect(mockAddItem).toHaveBeenCalledTimes(1)
    expect(mockAddItem).toHaveBeenCalledWith({
      variantId: 'var-123',
      productName: 'Polera Negra Minimal',
      variantDesc: 'Talla M',
      price: 12990,
      quantity: 1,
      imageUrl: '/img.jpg',
      slug: 'polera-negra-minimal',
    } satisfies CartItem)
  })

  it('is disabled when disabled=true even with stock', () => {
    render(<AddToCartButton {...defaultProps} disabled={true} />)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveTextContent('Agregar al carrito')
  })

  it('does not call addItem when disabled and clicked', () => {
    render(<AddToCartButton {...defaultProps} disabled={true} />)

    fireEvent.click(screen.getByRole('button'))

    expect(mockAddItem).not.toHaveBeenCalled()
  })

  it('renders a full-width button (className contains w-full)', () => {
    render(<AddToCartButton {...defaultProps} />)

    const button = screen.getByRole('button')
    expect(button.className).toContain('w-full')
  })
})
