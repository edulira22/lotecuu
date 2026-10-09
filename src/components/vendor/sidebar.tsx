'use client'

import { Car, Home, ImagePlus, Wallet, FolderLock, User, BadgeCheck, Menu } from 'lucide-react'
import { PortalNav, type PortalNavItem } from '@/components/ui/portal-nav'
import type { Seller } from '@/lib/supabase/database.types'

const NAV: PortalNavItem[] = [
  { href: '/vendedor', label: 'Inicio', icon: Home, exact: true, group: 'Mi negocio' },
  { href: '/vendedor/inventario', label: 'Mis autos', short: 'Autos', icon: Car, group: 'Mi negocio' },
  { href: '/vendedor/redes', label: 'Redes sociales', short: 'Redes', icon: ImagePlus, group: 'Mi negocio' },
  { href: '/vendedor/ventas', label: 'Ventas y ganancias', short: 'Ventas', icon: Wallet, group: 'Mi negocio' },
  { href: '/vendedor/documentos', label: 'Documentos', icon: FolderLock, group: 'Mi negocio' },
  { href: '/vendedor/perfil', label: 'Mi perfil', icon: User, group: 'Cuenta' },
  { href: '/vendedor/plan', label: 'Mi plan', icon: BadgeCheck, group: 'Cuenta' },
]

// Phone: the four daily sections + "Más" for the rest
const TABS: PortalNavItem[] = [
  NAV[0],
  NAV[1],
  NAV[2],
  NAV[3],
  { href: '/vendedor/mas', label: 'Más', icon: Menu },
]

const PLAN_LABEL: Record<string, string> = { basico: 'Básico', pro: 'Pro', premium: 'Premium' }
const PLAN_COLOR: Record<string, string> = { basico: '#9ca3af', pro: '#3fa9c5', premium: '#FB9833' }

export function VendorSidebar({ seller, canAdd }: { seller: Seller; canAdd: boolean }) {
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
      tabs={TABS}
      homeHref="/vendedor"
      cta={canAdd ? { href: '/vendedor/inventario/nuevo', label: 'Publicar auto' } : undefined}
      sidebarExtra={
        <div className="px-4 py-3" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
          <div className="text-[12px] text-white/70 font-[500] mb-1 truncate">{seller.business_name ?? seller.name}</div>
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
