'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: '◻' },
  { href: '/admin/productos', label: 'Productos', icon: '◼' },
  { href: '/admin/pedidos', label: 'Pedidos', icon: '◈' }
]

function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  // No mostrar sidebar en login
  if (pathname === '/login') return null

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex w-64 flex-col border-r border-neutral-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-neutral-200 px-6">
        <Link href="/admin" className="text-lg font-bold text-neutral-900">
          Arid Admin
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map(item => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-neutral-100 text-neutral-900'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Cerrar sesión */}
      <div className="border-t border-neutral-200 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  // Login page layout simple
  if (pathname === '/login') {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </main>
    </div>
  )
}
