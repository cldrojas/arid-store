// Centraliza la lógica de URLs de imágenes
// Todas las imágenes de producto pasan por aquí

const STORAGE_URL = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL

type ImageOptions = {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'jpg' | 'png'
}

export function getProductImageUrl(
  storagePath: string,
  options: ImageOptions = {}
): string {
  const { width = 800, quality = 80, format = 'webp' } = options
  const params = new URLSearchParams({
    width: String(width),
    quality: String(quality),
    format
  })
  if (options.height) params.set('height', String(options.height))

  return `${STORAGE_URL}/product-images/${storagePath}?${params}`
}

// Versiones predefinidas para uso consistente
export const imagePresets = {
  thumbnail: (path: string) =>
    getProductImageUrl(path, { width: 400, quality: 75 }),
  card: (path: string) =>
    getProductImageUrl(path, { width: 600, quality: 80 }),
  detail: (path: string) =>
    getProductImageUrl(path, { width: 900, quality: 85 }),
  adminThumb: (path: string) =>
    getProductImageUrl(path, { width: 200, quality: 70 })
}
