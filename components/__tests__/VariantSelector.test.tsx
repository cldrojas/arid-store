import { render, screen, fireEvent } from '@/lib/__tests__/test-utils'
import { VariantSelector } from '@/components/store/VariantSelector'
import type { ProductVariant } from '@/types'

function makeVariant(
  overrides: Partial<ProductVariant> & { size: string; color: string }
): Pick<ProductVariant, 'id' | 'size' | 'color' | 'color_hex' | 'stock'> {
  return {
    id: `${overrides.size}-${overrides.color}`,
    size: overrides.size as ProductVariant['size'],
    color: overrides.color,
    color_hex: overrides.color_hex ?? null,
    stock: overrides.stock ?? 1,
  }
}

const sizeVariants = [
  makeVariant({ size: 'S', color: 'Negro', stock: 3 }),
  makeVariant({ size: 'M', color: 'Negro', stock: 5 }),
  makeVariant({ size: 'L', color: 'Negro', stock: 0 }),
  makeVariant({ size: 'XL', color: 'Negro', stock: 2 }),
]

const colorVariants = [
  makeVariant({ size: 'M', color: 'Negro', color_hex: '#1a1a1a', stock: 5 }),
  makeVariant({ size: 'M', color: 'Blanco', color_hex: '#ffffff', stock: 3 }),
  makeVariant({ size: 'M', color: 'Rojo', color_hex: '#ff0000', stock: 0 }),
]

describe('VariantSelector with type="size"', () => {
  it('renders size buttons with label "Talla"', () => {
    render(
      <VariantSelector
        variants={sizeVariants}
        selectedValue={null}
        onChange={vi.fn()}
        type="size"
      />
    )

    expect(screen.getByText('Talla')).toBeInTheDocument()
    expect(screen.getByText('S')).toBeInTheDocument()
    expect(screen.getByText('M')).toBeInTheDocument()
    expect(screen.getByText('L')).toBeInTheDocument()
    expect(screen.getByText('XL')).toBeInTheDocument()
  })

  it('sorts sizes in correct order (XS, S, M, L, XL, XXL)', () => {
    const unsortedVariants = [
      makeVariant({ size: 'XL', color: 'Negro', stock: 2 }),
      makeVariant({ size: 'S', color: 'Negro', stock: 3 }),
      makeVariant({ size: 'XXL', color: 'Negro', stock: 1 }),
      makeVariant({ size: 'M', color: 'Negro', stock: 5 }),
      makeVariant({ size: 'XS', color: 'Negro', stock: 1 }),
    ]

    render(
      <VariantSelector
        variants={unsortedVariants}
        selectedValue={null}
        onChange={vi.fn()}
        type="size"
      />
    )

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(5)
    expect(buttons[0]).toHaveTextContent('XS')
    expect(buttons[1]).toHaveTextContent('S')
    expect(buttons[2]).toHaveTextContent('M')
    expect(buttons[3]).toHaveTextContent('L')
    expect(buttons[4]).toHaveTextContent('XL')
    // XXL exists but there's no L before it in the test set...
    // Actually the sort puts it at the end: XS, S, M, XL (no L in data), then XXL
    // Wait, XXL is after XL in sizeOrder. Since XL and XXL are both in the data,
    // XL < XXL in the order. So: XS, S, M, XL, XXL
    // Let's check button[4] should be XXL
    // Actually XL is index 4 (5th button) — wait, let me recount
    // XS, S, M, XL, XXL — that's 5 buttons
    // XL is at index 3, XXL is at index 4
    expect(buttons[3]).toHaveTextContent('XL')
    expect(buttons[4]).toHaveTextContent('XXL')
  })

  it('marks the selectedValue as active with bg-neutral-900 class', () => {
    render(
      <VariantSelector
        variants={sizeVariants}
        selectedValue="M"
        onChange={vi.fn()}
        type="size"
      />
    )

    const buttons = screen.getAllByRole('button')
    const selectedButton = buttons.find(btn => btn.textContent === 'M')
    const unselectedButton = buttons.find(btn => btn.textContent === 'S')

    expect(selectedButton).toHaveClass('bg-neutral-900')
    expect(selectedButton).toHaveClass('text-white')
    expect(unselectedButton).not.toHaveClass('bg-neutral-900')
  })

  it('disables size buttons that have no stock', () => {
    render(
      <VariantSelector
        variants={sizeVariants}
        selectedValue={null}
        onChange={vi.fn()}
        type="size"
      />
    )

    const buttons = screen.getAllByRole('button')
    const sizeLButton = buttons.find(btn => btn.textContent === 'L')
    const sizeSButton = buttons.find(btn => btn.textContent === 'S')

    expect(sizeLButton).toBeDisabled()
    expect(sizeSButton).not.toBeDisabled()
  })

  it('calls onChange when clicking a size with stock', () => {
    const onChange = vi.fn()

    render(
      <VariantSelector
        variants={sizeVariants}
        selectedValue={null}
        onChange={onChange}
        type="size"
      />
    )

    fireEvent.click(screen.getByText('M'))
    expect(onChange).toHaveBeenCalledWith('M')
  })

  it('does NOT call onChange when clicking a size without stock', () => {
    const onChange = vi.fn()

    render(
      <VariantSelector
        variants={sizeVariants}
        selectedValue={null}
        onChange={onChange}
        type="size"
      />
    )

    fireEvent.click(screen.getByText('L'))
    expect(onChange).not.toHaveBeenCalled()
  })
})

describe('VariantSelector with type="color"', () => {
  it('renders color buttons with label "Color"', () => {
    render(
      <VariantSelector
        variants={colorVariants}
        selectedValue={null}
        onChange={vi.fn()}
        type="color"
      />
    )

    expect(screen.getByText('Color')).toBeInTheDocument()
    expect(screen.getByTitle('Negro')).toBeInTheDocument()
    expect(screen.getByTitle('Blanco')).toBeInTheDocument()
    expect(screen.getByTitle('Rojo')).toBeInTheDocument()
  })

  it('marks the selected color with border-neutral-900 class', () => {
    render(
      <VariantSelector
        variants={colorVariants}
        selectedValue="Negro"
        onChange={vi.fn()}
        type="color"
      />
    )

    const negroBtn = screen.getByTitle('Negro')
    const blancoBtn = screen.getByTitle('Blanco')
    const negroSwatch = negroBtn.querySelector('span')
    const blancoSwatch = blancoBtn.querySelector('span')

    expect(negroSwatch).toHaveClass('border-neutral-900')
    expect(blancoSwatch).toHaveClass('border-neutral-300')
  })

  it('shows the name of the selected color', () => {
    render(
      <VariantSelector
        variants={colorVariants}
        selectedValue="Blanco"
        onChange={vi.fn()}
        type="color"
      />
    )

    expect(screen.getByText('Blanco')).toBeInTheDocument()
  })

  it('does not show color name when no color is selected', () => {
    render(
      <VariantSelector
        variants={colorVariants}
        selectedValue={null}
        onChange={vi.fn()}
        type="color"
      />
    )

    expect(screen.queryByText('Negro')).not.toBeInTheDocument()
    // "Color" label should still be present
    expect(screen.getByText('Color')).toBeInTheDocument()
  })

  it('applies inline background color from color_hex', () => {
    render(
      <VariantSelector
        variants={colorVariants}
        selectedValue={null}
        onChange={vi.fn()}
        type="color"
      />
    )

    const negroBtn = screen.getByTitle('Negro')
    const swatch = negroBtn.querySelector('span')
    expect(swatch).toHaveStyle({ backgroundColor: '#1a1a1a' })
  })

  it('calls onChange when clicking a color with stock', () => {
    const onChange = vi.fn()

    render(
      <VariantSelector
        variants={colorVariants}
        selectedValue={null}
        onChange={onChange}
        type="color"
      />
    )

    fireEvent.click(screen.getByTitle('Negro'))
    expect(onChange).toHaveBeenCalledWith('Negro')
  })

  it('does NOT call onChange when clicking a color without stock', () => {
    const onChange = vi.fn()

    render(
      <VariantSelector
        variants={colorVariants}
        selectedValue={null}
        onChange={onChange}
        type="color"
      />
    )

    fireEvent.click(screen.getByTitle('Rojo'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('disables color buttons without stock and shows strikethrough', () => {
    render(
      <VariantSelector
        variants={colorVariants}
        selectedValue={null}
        onChange={vi.fn()}
        type="color"
      />
    )

    const rojoBtn = screen.getByTitle('Rojo')
    expect(rojoBtn).toBeDisabled()

    // Out-of-stock indicator (strikethrough span) should exist
    const strikethrough = rojoBtn.querySelector('.rotate-45')
    expect(strikethrough).toBeInTheDocument()
  })

  it('deduplicates colors from multiple variants with same color', () => {
    const variantsWithDuplicates = [
      ...colorVariants,
      makeVariant({ size: 'L', color: 'Negro', color_hex: '#1a1a1a', stock: 2 }),
      makeVariant({ size: 'XL', color: 'Blanco', color_hex: '#ffffff', stock: 0 }),
    ]

    render(
      <VariantSelector
        variants={variantsWithDuplicates}
        selectedValue={null}
        onChange={vi.fn()}
        type="color"
      />
    )

    // Only 3 unique colors: Negro, Blanco, Rojo
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(3)
  })
})
