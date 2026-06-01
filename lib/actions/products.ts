'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'

export type ProductFormState = {
  success?: boolean
  error?: string
}

export async function createProduct(_prevState: ProductFormState, formData: FormData): Promise<ProductFormState> {
  try {
    const supabase = createAdminClient()
    const raw = JSON.parse(formData.get('data') as string)

    // Crear producto
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        name: raw.name,
        slug: raw.slug,
        description: raw.description || null,
        base_price: raw.base_price,
        is_active: raw.is_active ?? true
      })
      .select('id')
      .single()

    if (productError || !product) {
      return { error: productError?.message ?? 'Error al crear producto' }
    }

    // Crear variantes
    const validVariants = (raw.variants ?? []).filter((v: any) => v.color?.trim())
    if (validVariants.length > 0) {
      const { error: variantsError } = await supabase
        .from('product_variants')
        .insert(
          validVariants.map((v: any) => ({
            product_id: product.id,
            size: v.size,
            color: v.color,
            color_hex: v.color_hex || null,
            stock: v.stock,
            sku: v.sku || null,
            price_override: v.price_override ? Number(v.price_override) : null
          }))
        )

      if (variantsError) return { error: variantsError.message }
    }

    // Crear imágenes
    const validImages = (raw.images ?? []).filter((i: any) => i.storage_path?.trim())
    if (validImages.length > 0) {
      const { error: imagesError } = await supabase
        .from('product_images')
        .insert(
          validImages.map((img: any) => ({
            product_id: product.id,
            variant_id: null,
            storage_path: img.storage_path,
            alt_text: img.alt_text || null,
            sort_order: img.sort_order,
            is_primary: img.is_primary
          }))
        )

      if (imagesError) return { error: imagesError.message }
    }

    revalidateTag('products', { expire: 0 })
    return { success: true }

  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

export async function updateProduct(_prevState: ProductFormState, formData: FormData): Promise<ProductFormState> {
  try {
    const supabase = createAdminClient()
    const raw = JSON.parse(formData.get('data') as string)

    const { error: productError } = await supabase
      .from('products')
      .update({
        name: raw.name,
        slug: raw.slug,
        description: raw.description || null,
        base_price: raw.base_price,
        is_active: raw.is_active ?? true
      })
      .eq('id', raw.id)

    if (productError) return { error: productError.message }

    // Reemplazar variantes (delete + insert)
    await supabase.from('product_variants').delete().eq('product_id', raw.id)

    const validVariants = (raw.variants ?? []).filter((v: any) => v.color?.trim())
    if (validVariants.length > 0) {
      const { error: variantsError } = await supabase
        .from('product_variants')
        .insert(
          validVariants.map((v: any) => ({
            product_id: raw.id,
            size: v.size,
            color: v.color,
            color_hex: v.color_hex || null,
            stock: v.stock,
            sku: v.sku || null,
            price_override: v.price_override ? Number(v.price_override) : null
          }))
        )

      if (variantsError) return { error: variantsError.message }
    }

    // Reemplazar imágenes (delete + insert)
    await supabase.from('product_images').delete().eq('product_id', raw.id)

    const validImages = (raw.images ?? []).filter((i: any) => i.storage_path?.trim())
    if (validImages.length > 0) {
      const { error: imagesError } = await supabase
        .from('product_images')
        .insert(
          validImages.map((img: any) => ({
            product_id: raw.id,
            variant_id: null,
            storage_path: img.storage_path,
            alt_text: img.alt_text || null,
            sort_order: img.sort_order,
            is_primary: img.is_primary
          }))
        )

      if (imagesError) return { error: imagesError.message }
    }

    revalidateTag('products', { expire: 0 })
    return { success: true }

  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

export async function toggleProductActive(_prevState: ProductFormState, formData: FormData): Promise<ProductFormState> {
  try {
    const supabase = createAdminClient()
    const id = formData.get('id') as string
    const isActive = formData.get('is_active') === 'true'

    const { error } = await supabase
      .from('products')
      .update({ is_active: isActive })
      .eq('id', id)

    if (error) return { error: error.message }

    revalidateTag('products', { expire: 0 })
    return { success: true }

  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}
