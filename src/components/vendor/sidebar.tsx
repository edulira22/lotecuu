'use client'

import { Car, User } from 'lucide-react'
import { PortalNav, type PortalNavItem } from '@/components/ui/portal-nav'
import type { Seller } from '@/lib/supabase/database.types'

const NAV: PortalNavItem[] = [
  { href: '/vendedor/inventario', label: 'Mis autos', icon: Car },
  { href: '/vendedor/perfil', label: 'Mi perfil', icon: User },
]

const PLAN_LABEL: Record<string, string> = { basico: 'Básico', pro: 'Pro', premium: 'Premium' }
const PLAN_COLOR: Record<string, string> = { basico: '#9ca3af', pro: '#3fa9c5', premium: '#FB9833' }

export function VendorSidebar({ seller }: { seller: Seller }) {
  const planColor = PLAN_COLOR[seller.plan] ?? '#9ca3af'
  const planBadge = (
    <span
      className="text-[10px] font-[600] uppercase tracking-[0.12em] px-2 py-0.5 rounded-[3px] whitespace-nowrap"
      style={{ background: planColor + '33', color: planColor }}
    >
      Plan {PLAN_LABEL[seller.plan] ?? seller.plan}
    </span>
  )

  return (
    <PortalNav
      nav={NAV}
      homeHref="/vendedor/inventario"
      sidebarExtra={
        <div className="px-4 py-3" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
          <div className="text-[11px] text-white/40 mb-1 truncate">{seller.business_name ?? seller.name}</div>
          <div className="flex items-center gap-2 flex-wrap">
            {planBadge}
            {seller.payment_status === 'atrasado' && (
              <span className="text-[10px] font-[500] text-amber-400">⚠ Pago pendiente</span>
            )}
          </div>
        </div>
      }
      topBarExtra={
        <span className="flex items-center gap-1.5 mr-1">
          {seller.payment_status === 'atrasado' && <span className="text-[11px] text-amber-400" title="Pago pendiente">⚠</span>}
          {planBadge}
        </span>
      }
    />
  )
}
