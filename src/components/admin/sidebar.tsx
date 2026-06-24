'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Car, Users, LogOut, LayoutDashboard, FileText } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { signOut } from '@/app/admin/actions'

const NAV = [
  { href: '/admin/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/admin/inventario',  label: 'Inventario',  icon: Car },
  { href: '/admin/vendedores',  label: 'Vendedores',  icon: Users },
  { href: '/admin/formulario',  label: 'Formulario',  icon: FileText },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="w-60 shrink-0 flex flex-col"
      style={{ background: '#012538', minHeight: '100vh' }}
    >
      {/* Brand */}
      <div
        className="flex items-center gap-2.5 px-4 py-5"
        style={{ borderBottom: '0.5px solid rgba(255,255,255,0.10)' }}
      >
        <Logo variant="dark" size="sm" href="/admin/inventario" />
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 p-3 flex-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] text-[13px] font-[500] transition-colors"
              style={{
                background: active ? 'rgba(251,152,51,0.18)' : 'transparent',
                color: active ? '#FBB96A' : 'rgba(255,255,255,0.75)',
              }}
            >
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="p-3" style={{ borderTop: '0.5px solid rgba(255,255,255,0.10)' }}>
        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-[8px] text-[13px] font-[500] transition-colors"
            style={{ color: 'rgba(255,255,255,0.50)' }}
          >
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  )
}
