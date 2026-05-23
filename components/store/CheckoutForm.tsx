'use client'

import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { ShippingAddress } from '@/types'

const CHILEAN_REGIONS = [
  'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama',
  'Coquimbo', 'Valparaíso', 'Metropolitana', "O'Higgins",
  'Maule', 'Ñuble', 'Biobío', 'La Araucanía',
  'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes'
]

type FormData = {
  name: string
  email: string
  phone: string
  street: string
  city: string
  region: string
  zip: string
  notes: string
}

type FormErrors = Partial<Record<keyof FormData, string>>

type CheckoutFormProps = {
  onSubmit: (data: {
    name: string
    email: string
    phone: string
    address: ShippingAddress
  }) => Promise<void>
  isSubmitting: boolean
}

export function CheckoutForm({ onSubmit, isSubmitting }: CheckoutFormProps) {
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    region: '',
    zip: '',
    notes: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})

  function validate(): FormErrors {
    const errs: FormErrors = {}
    if (!form.name.trim()) errs.name = 'Nombre requerido'
    if (!form.email.trim()) {
      errs.email = 'Email requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Email inválido'
    }
    if (!form.street.trim()) errs.street = 'Dirección requerida'
    if (!form.city.trim()) errs.city = 'Ciudad requerida'
    if (!form.region) errs.region = 'Región requerida'
    return errs
  }

  function handleChange(field: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    await onSubmit({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: {
        street: form.street.trim(),
        city: form.city.trim(),
        region: form.region,
        zip: form.zip.trim() || null,
        notes: form.notes.trim() || null
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-neutral-900">Datos del cliente</h3>

        <Input
          label="Nombre completo"
          placeholder="Juan Pérez"
          value={form.name}
          onChange={e => handleChange('name', e.target.value)}
          error={errors.name}
        />

        <Input
          label="Email"
          type="email"
          placeholder="juan@ejemplo.com"
          value={form.email}
          onChange={e => handleChange('email', e.target.value)}
          error={errors.email}
        />

        <Input
          label="Teléfono (opcional)"
          type="tel"
          placeholder="+56 9 1234 5678"
          value={form.phone}
          onChange={e => handleChange('phone', e.target.value)}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold text-neutral-900">Dirección de envío</h3>

        <Input
          label="Calle y número"
          placeholder="Av. Providencia 1234"
          value={form.street}
          onChange={e => handleChange('street', e.target.value)}
          error={errors.street}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Ciudad"
            placeholder="Santiago"
            value={form.city}
            onChange={e => handleChange('city', e.target.value)}
            error={errors.city}
          />

          <Select
            label="Región"
            placeholder="Seleccionar región"
            items={CHILEAN_REGIONS.map(r => ({ value: r, label: r }))}
            value={form.region}
            onValueChange={v => handleChange('region', v)}
            error={errors.region}
          />
        </div>

        <Input
          label="Código postal (opcional)"
          placeholder="7500000"
          value={form.zip}
          onChange={e => handleChange('zip', e.target.value)}
        />

        <Input
          label="Notas de envío (opcional)"
          placeholder="Dejar en conserjería"
          value={form.notes}
          onChange={e => handleChange('notes', e.target.value)}
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
        {isSubmitting ? 'Procesando...' : 'Ir a pagar'}
      </Button>
    </form>
  )
}
