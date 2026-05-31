// Centraliza la lógica de URLs de imágenes
// Todas las imágenes de producto pasan por aquí
// Usa el endpoint público de Storage (gratuito, sin transformación de imágenes)

const STORAGE_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images`

export function getProductImageUrl(storagePath: string): string {
  return `${STORAGE_BASE}/${storagePath}`
}

// Versiones predefinidas para uso consistente
// Nota: Supabase Image Transformation requiere plan pago (FeatureNotEnabled)
// Por ahora todas las URLs son iguales (sin resize/format)
export const imagePresets = {
  thumbnail: getProductImageUrl,
  card: getProductImageUrl,
  detail: getProductImageUrl,
  adminThumb: getProductImageUrl
}
