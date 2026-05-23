// Formatear precio en CLP: 12990 → "$12.990"
export function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(amount)
}

// Generar slug desde nombre: "Polera Negra Minimal" → "polera-negra-minimal"
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

// Abreviar UUID para mostrar: "abc12345-..." → "ABC12345"
export function shortId(uuid: string): string {
  return uuid.replace(/-/g, '').substring(0, 8).toUpperCase()
}
