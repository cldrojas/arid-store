import { render, screen, fireEvent } from '@/lib/__tests__/test-utils'
import { CartDrawer } from '@/components/store/CartDrawer'
import type { CartItem } from '@/types'

const { mockUseCart } = vi.hoisted(() => ({ mockUseCart: vi.fn() }))

vi.mock('@/context/CartContext', () => ({
  useCart: () => mockUseCart(),
  CartProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const mockItems: CartItem[] = [
  {
    variantId: 'v1',
    productName: 'Polera Negra',
    variantDesc: 'Talla M - Negro',
    price: 19990,
    quantity: 2,
    imageUrl: '/img-1.jpg',
    slug: 'polera-negra',
  },
  {
    variantId: 'v2',
    productName: 'Polera Blanca',
    variantDesc: 'Talla L - Blanco',
    price: 14990,
    quantity: 1,
    imageUrl: '/img-2.jpg',
    slug: 'polera-blanca',
  },
]

function mockCart(items: CartItem[], total?: number) {
  const computedTotal = total ?? items.reduce((acc, i) => acc + i.price * i.quantity, 0)
  mockUseCart.mockReturnValue({
    items,
    itemCount: items.reduce((acc, i) => acc + i.quantity, 0),
    total: computedTotal,
    addItem: vi.fn(),
    removeItem: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
  })
}

beforeEach(() => {
  mockCart([])
})

describe('CartDrawer', () => {
  describe('when cart is empty', () => {
    beforeEach(() => {
      mockCart([])
    })

    it('shows "Tu carrito está vacío"', () => {
      render(<CartDrawer isOpen={true} onClose={vi.fn()} />)

      expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument()
    })

    it('shows "Carrito (0)" in the header', () => {
      render(<CartDrawer isOpen={true} onClose={vi.fn()} />)

      expect(screen.getByText('Carrito (0)')).toBeInTheDocument()
    })

    it('does not render the footer with total and checkout link', () => {
      render(<CartDrawer isOpen={true} onClose={vi.fn()} />)

      expect(screen.queryByText('Total')).not.toBeInTheDocument()
      expect(screen.queryByText('Ir al carrito')).not.toBeInTheDocument()
    })
  })

  describe('when cart has items', () => {
    beforeEach(() => {
      mockCart(mockItems, 54970) // 19990*2 + 14990 = 54970
    })

    it('shows item count in the header', () => {
      render(<CartDrawer isOpen={true} onClose={vi.fn()} />)

      expect(screen.getByText('Carrito (2)')).toBeInTheDocument()
    })

    it('renders cart items', () => {
      render(<CartDrawer isOpen={true} onClose={vi.fn()} />)

      expect(screen.getByText('Polera Negra')).toBeInTheDocument()
      expect(screen.getByText('Polera Blanca')).toBeInTheDocument()
    })

    it('shows the total', () => {
      render(<CartDrawer isOpen={true} onClose={vi.fn()} />)

      expect(screen.getByText(/\$54\.?970/)).toBeInTheDocument()
    })

    it('shows footer with link to /carrito', () => {
      render(<CartDrawer isOpen={true} onClose={vi.fn()} />)

      const checkoutLink = screen.getByText('Ir al carrito')
      expect(checkoutLink).toBeInTheDocument()
      expect(checkoutLink.closest('a')).toHaveAttribute('href', '/carrito')
    })

    it('does not show empty cart message', () => {
      render(<CartDrawer isOpen={true} onClose={vi.fn()} />)

      expect(screen.queryByText('Tu carrito está vacío')).not.toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('calls onClose when overlay is clicked', () => {
      const onClose = vi.fn()
      const { container } = render(<CartDrawer isOpen={true} onClose={onClose} />)

      // Overlay is the div with bg-black/40
      const overlay = container.querySelector('.fixed.inset-0')
      expect(overlay).toBeInTheDocument()

      fireEvent.click(overlay!)
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn()
      render(<CartDrawer isOpen={true} onClose={onClose} />)

      const closeButton = screen.getByLabelText('Cerrar carrito')
      fireEvent.click(closeButton)
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when Escape key is pressed', () => {
      const onClose = vi.fn()
      render(<CartDrawer isOpen={true} onClose={onClose} />)

      fireEvent.keyDown(document, { key: 'Escape' })
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('does not listen for Escape when drawer is closed', () => {
      const onClose = vi.fn()
      render(<CartDrawer isOpen={false} onClose={onClose} />)

      fireEvent.keyDown(document, { key: 'Escape' })
      expect(onClose).not.toHaveBeenCalled()
    })

    it('applies translate-x-full class when closed', () => {
      const { container } = render(<CartDrawer isOpen={false} onClose={vi.fn()} />)

      // The drawer panel is the element with both fixed and right-0 classes
      const drawerPanel = container.querySelector('[class*="fixed"][class*="right-0"]')
      expect(drawerPanel).toBeInTheDocument()
      expect(drawerPanel!.className).toContain('translate-x-full')
    })

    it('applies translate-x-0 class when open', () => {
      const { container } = render(<CartDrawer isOpen={true} onClose={vi.fn()} />)

      const drawerPanel = container.querySelector('[class*="fixed"][class*="right-0"]')
      expect(drawerPanel).toBeInTheDocument()
      expect(drawerPanel!.className).toContain('translate-x-0')
    })

    it('does not render overlay when isOpen is false', () => {
      const { container } = render(<CartDrawer isOpen={false} onClose={vi.fn()} />)

      const overlay = container.querySelector('.fixed.inset-0')
      expect(overlay).not.toBeInTheDocument()
    })

    it('calls onClose when "Ir al carrito" link is clicked', () => {
      const onClose = vi.fn()
      mockCart(mockItems, 54970)
      render(<CartDrawer isOpen={true} onClose={onClose} />)

      const checkoutLink = screen.getByText('Ir al carrito')
      fireEvent.click(checkoutLink)
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })
})
