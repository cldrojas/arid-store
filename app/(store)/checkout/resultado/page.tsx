'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { Button } from '@/components/ui/Button'

function ResultadoContent() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status')
  const { clearCart } = useCart()
  const [cleared, setCleared] = useState(false)

  useEffect(() => {
    if (status === 'approved' && !cleared) {
      clearCart()
      setCleared(true)
    }
  }, [status, clearCart, cleared])

  if (status === 'approved') {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            className="text-green-600 dark:text-green-300"
          >
            <path
              d="M5 13L9 17L19 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-content">
          ¡Pago exitoso!
        </h1>
        <p className="mt-3 text-content-secondary">
          Recibimos tu pedido. Te enviaremos un email de confirmación con los
          detalles y te avisaremos cuando sea despachado.
        </p>
        <Link href="/productos">
          <Button className="mt-8">Seguir comprando</Button>
        </Link>
      </div>
    )
  }

  if (status === 'rejected') {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            className="text-red-600 dark:text-red-300"
          >
            <path
              d="M6 6L18 18M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-content">
          Pago rechazado
        </h1>
        <p className="mt-3 text-content-secondary">
          El pago no pudo ser procesado. Puedes intentar con otro medio de pago.
        </p>
        <Link href="/checkout">
          <Button className="mt-8">Intentar de nuevo</Button>
        </Link>
      </div>
    )
  }

  // pending or unknown
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          className="text-amber-600 dark:text-amber-300"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path
            d="M12 8V12L14 14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <h1 className="mt-6 text-2xl font-bold text-content">
        Pago pendiente
      </h1>
      <p className="mt-3 text-content-secondary">
        El pago está siendo procesado. Te notificaremos por email cuando se
        confirme.
      </p>
      <Link href="/productos">
        <Button className="mt-8" variant="outline">
          Volver a la tienda
        </Button>
      </Link>
    </div>
  )
}

export default function ResultadoPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-24 text-center text-content-muted">
          Cargando...
        </div>
      }
    >
      <ResultadoContent />
    </Suspense>
  )
}
