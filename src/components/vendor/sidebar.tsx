'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Car, User, LogOut } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { signOut } from '@/app/admin/actions'
import type { Seller } from '@/lib/supabase/database.types'

const NAV = [
  { href: '/vendedor/inventario', label: 'Mis autos', icon: Car },
  { href: '/vendedor/perfil', label: 'Mi perfil', icon: User },
]

const PLAN_LABEL: Record<string, string> = { basico: 'Básico', pro: 'Pro', premium: 'Premium' }
const PLAN_COLOR: Record<string, string> = { basico: '#6b7280', pro: '#1B768E', premium: '#FB9833' }

export function VendorSidebar({ seller }: { seller: Seller }) {
  const pathname = usePathname()
  const planColor = PLAN_COLOR[seller.plan] ?? '#6b7280'

  return (
    <aside className="w-60 shrink-0 flex flex-col" style={{ background: '#012538', minHeight: '100vh' }}>
      <div className="flex items-center px-4 py-5" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.10)' }}>
        <Logo variant="dark" size="sm" href="/vendedor/inventario" />
      </div>

      {/* Plan info */}
      <div className="px-4 py-3" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
        <div className="text-[11px] text-white/40 mb-1 truncate">{seller.business_name ?? seller.name}</div>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[10px] font-[600] uppercase tracking-[0.12em] px-2 py-0.5 rounded-pill"
            style={{ background: planColor + '33', color: planColor }}
          >
            Plan {PLAN_LABEL[seller.plan] ?? seller.plan}
          </span>
          {seller.payment_status === 'atrasado' && (
            <span className="text-[10px] font-[500] text-amber-400">⚠ Pago pendiente</span>
          )}
        </div>
      </div>

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

      <div className="p-3" style={{ borderTop: '0.5px solid rgba(255,255,255,0.10)' }}>
        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-[8px] text-[13px] font-[500]"
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
