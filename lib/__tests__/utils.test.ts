import { formatCLP, slugify, shortId } from '@/lib/utils'

describe('formatCLP', () => {
  it('formats 14990 as $14.990', () => {
    expect(formatCLP(14990)).toBe('$14.990')
  })

  it('formats 0 as $0', () => {
    expect(formatCLP(0)).toBe('$0')
  })

  it('formats 1,000,000 as $1.000.000', () => {
    expect(formatCLP(1_000_000)).toBe('$1.000.000')
  })

  it('handles negative amounts', () => {
    expect(formatCLP(-5000)).toBe('$-5.000')
  })

  it('rounds decimal amounts to nearest integer', () => {
    // maximumFractionDigits: 0 rounds the value
    expect(formatCLP(14990.5)).toBe('$14.991')
    expect(formatCLP(14990.3)).toBe('$14.990')
  })

  it('handles very large numbers', () => {
    expect(formatCLP(999_999_999)).toBe('$999.999.999')
  })
})

describe('slugify', () => {
  it('converts "Polera Negra Minimal" to "polera-negra-minimal"', () => {
    expect(slugify('Polera Negra Minimal')).toBe('polera-negra-minimal')
  })

  it('removes special characters like !', () => {
    expect(slugify('Camiseta Azul!')).toBe('camiseta-azul')
  })

  it('trims leading and trailing whitespace', () => {
    expect(slugify('  espacios  ')).toBe('espacios')
  })

  it('collapses multiple spaces into a single hyphen', () => {
    expect(slugify('palabra1   palabra2')).toBe('palabra1-palabra2')
  })

  it('removes diacritics (tildes)', () => {
    expect(slugify('Camión')).toBe('camion')
    expect(slugify('Árbol')).toBe('arbol')
    expect(slugify('Canción')).toBe('cancion')
    expect(slugify('Índice Útil')).toBe('indice-util')
  })

  it('converts to lowercase', () => {
    expect(slugify('POLERA NEGRA')).toBe('polera-negra')
    expect(slugify('MiXeD CaSe')).toBe('mixed-case')
  })

  it('allows numbers in the slug', () => {
    expect(slugify('Producto 2025')).toBe('producto-2025')
  })

  it('returns empty string for empty input', () => {
    expect(slugify('')).toBe('')
  })

  it('returns empty string for input with only special characters', () => {
    expect(slugify('!!!')).toBe('')
    expect(slugify('@#$%^&*()')).toBe('')
  })
})

describe('shortId', () => {
  const FULL_UUID = 'abc12345-6789-4def-ghij-klmnopqrstuv'

  it('returns first 8 chars without dashes, uppercased', () => {
    expect(shortId(FULL_UUID)).toBe('ABC12345')
  })

  it('works with a real UUID format', () => {
    expect(shortId('550e8400-e29b-41d4-a716-446655440000')).toBe('550E8400')
  })

  it('handles UUID without dashes', () => {
    expect(shortId('abcdef0123456789')).toBe('ABCDEF01')
  })

  it('returns empty string for empty input', () => {
    expect(shortId('')).toBe('')
  })

  it('pads nothing when input is shorter than 8 characters', () => {
    expect(shortId('abc')).toBe('ABC')
  })
})
