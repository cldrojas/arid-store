'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createProduct, updateProduct, type ProductFormState } from '@/lib/actions/products'

type VariantInput = {
  id?: string
  size: string
  color: string
  color_hex: string
  stock: number
  sku: string
  price_override: string
}

type ImageInput = {
  id?: string
  storage_path: string
  alt_text: string
  is_primary: boolean
  sort_order: number
}

type ProductFormProps = {
  initialData?: {
    id: string
    name: string
    slug: string
    description: string
    base_price: number
    is_active: boolean
    variants: VariantInput[]
    images: ImageInput[]
  }
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

function emptyVariant(): VariantInput {
  return { size: 'M', color: '', color_hex: '', stock: 0, sku: '', price_override: '' }
}

function emptyImage(): ImageInput {
  return { storage_path: '', alt_text: '', is_primary: false, sort_order: 0 }
}

export function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter()
  const isEdit = !!initialData

  const [name, setName] = useState(initialData?.name ?? '')
  const [slug, setSlug] = useState(initialData?.slug ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [basePrice, setBasePrice] = useState(String(initialData?.base_price ?? ''))
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true)

  const [variants, setVariants] = useState<VariantInput[]>(
    initialData?.variants ?? [emptyVariant()]
  )
  const [images, setImages] = useState<ImageInput[]>(
    initialData?.images ?? []
  )

  const [validationError, setValidationError] = useState<string | null>(null)

  async function handleSubmit(_prevState: ProductFormState, formData: FormData): Promise<ProductFormState> {
    setValidationError(null)

    if (!name.trim()) { setValidationError('Nombre requerido'); return { error: 'Nombre requerido' } }
    if (!slug.trim()) { setValidationError('Slug requerido'); return { error: 'Slug requerido' } }
    if (!basePrice || Number(basePrice) <= 0) { setValidationError('Precio base inválido'); return { error: 'Precio base inválido' } }

    const data = {
      ...(isEdit ? { id: initialData!.id } : {}),
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim(),
      base_price: Number(basePrice),
      is_active: isActive,
      variants,
      images
    }

    const payload = new FormData()
    payload.set('data', JSON.stringify(data))

    const action = isEdit ? updateProduct : createProduct
    const result = await action(_prevState, payload)

    if (result.success) {
      router.push('/admin/productos')
      router.refresh()
    }

    return result
  }

  const [state, formAction, isPending] = useActionState(handleSubmit, {} as ProductFormState)

  function addVariant() {
    setVariants(prev => [...prev, emptyVariant()])
  }

  function updateVariant(index: number, field: keyof VariantInput, value: string | number) {
    setVariants(prev => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)))
  }

  function removeVariant(index: number) {
    setVariants(prev => prev.filter((_, i) => i !== index))
  }

  function addImage() {
    setImages(prev => [...prev, emptyImage()])
  }

  function updateImage(index: number, field: keyof ImageInput, value: string | number | boolean) {
    setImages(prev => prev.map((img, i) => (i === index ? { ...img, [field]: value } : img)))
  }

  function removeImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <form action={formAction} className="space-y-8">
      {(validationError || state?.error) && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {validationError ?? state!.error}
        </div>
      )}

      {/* Datos básicos */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-neutral-900">
          Información del producto
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Nombre" value={name} onChange={e => setName(e.target.value)} />
          <Input label="Slug" value={slug} onChange={e => setSlug(e.target.value)} />
        </div>

        <div>
          <label className="text-sm font-medium text-neutral-700">Descripción</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            className="mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 transition-colors focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Precio base (CLP)"
            type="number"
            value={basePrice}
            onChange={e => setBasePrice(e.target.value)}
          />

          <label className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-400"
            />
            <span className="text-sm text-neutral-700">Producto activo</span>
          </label>
        </div>
      </section>

      {/* Variantes */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-neutral-900">Variantes</h3>
          <Button type="button" variant="outline" size="sm" onClick={addVariant}>
            + Agregar variante
          </Button>
        </div>

        {variants.map((v, i) => (
          <div key={i} className="flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 p-4">
            <div>
              <label className="text-xs font-medium text-neutral-500">Talla</label>
              <select
                value={v.size}
                onChange={e => updateVariant(i, 'size', e.target.value)}
                className="mt-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              >
                {SIZES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <Input label="Color" value={v.color} onChange={e => updateVariant(i, 'color', e.target.value)} />
            <Input label="Hex" value={v.color_hex} onChange={e => updateVariant(i, 'color_hex', e.target.value)} className="w-24" />
            <Input label="Stock" type="number" value={String(v.stock)} onChange={e => updateVariant(i, 'stock', Number(e.target.value))} className="w-24" />
            <Input label="SKU" value={v.sku} onChange={e => updateVariant(i, 'sku', e.target.value)} className="w-28" />
            <Input label="Precio (opcional)" type="number" value={v.price_override} onChange={e => updateVariant(i, 'price_override', e.target.value)} className="w-28" />
            <Button type="button" variant="ghost" size="sm" onClick={() => removeVariant(i)} className="text-red-500">
              Eliminar
            </Button>
          </div>
        ))}
      </section>

      {/* Imágenes */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-neutral-900">Imágenes</h3>
          <Button type="button" variant="outline" size="sm" onClick={addImage}>
            + Agregar imagen
          </Button>
        </div>

        {images.map((img, i) => (
          <div key={i} className="flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 p-4">
            <Input label="Storage path" value={img.storage_path} onChange={e => updateImage(i, 'storage_path', e.target.value)} className="min-w-[200px]" />
            <Input label="Alt text" value={img.alt_text} onChange={e => updateImage(i, 'alt_text', e.target.value)} />
            <Input label="Orden" type="number" value={String(img.sort_order)} onChange={e => updateImage(i, 'sort_order', Number(e.target.value))} className="w-20" />
            <label className="flex items-center gap-2 pb-2">
              <input
                type="checkbox"
                checked={img.is_primary}
                onChange={e => updateImage(i, 'is_primary', e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-neutral-900"
              />
              <span className="text-xs text-neutral-600">Principal</span>
            </label>
            <Button type="button" variant="ghost" size="sm" onClick={() => removeImage(i)} className="text-red-500">Eliminar</Button>
          </div>
        ))}
      </section>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando...' : isEdit ? 'Actualizar producto' : 'Crear producto'}
        </Button>
      </div>
    </form>
  )
}
