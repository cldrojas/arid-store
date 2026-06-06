'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
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
    <aside className="flex w-64 flex-col border-r border-edge bg-surface">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-edge px-6">
        <div className="flex w-full items-center justify-between">
          <Link href="/admin" className="text-lg font-bold text-content">
            Arid Admin
          </Link>
          <ThemeToggle />
        </div>
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
                  ? 'bg-surface-tertiary text-content'
                  : 'text-content-secondary hover:bg-surface-secondary hover:text-content'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Cerrar sesión */}
      <div className="border-t border-edge p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-content-secondary hover:bg-surface-secondary hover:text-content transition-colors"
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
    <div className="flex min-h-screen bg-surface-secondary">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </main>
    </div>
  )
}
