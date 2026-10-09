'use client'

import { Car, Users, LayoutDashboard, FileText, KeyRound, ImagePlus } from 'lucide-react'
import { PortalNav, type PortalNavItem } from '@/components/ui/portal-nav'

const NAV: PortalNavItem[] = [
  { href: '/admin/dashboard',  label: 'Dashboard',  short: 'Inicio',  icon: LayoutDashboard, group: 'Catálogo' },
  { href: '/admin/inventario', label: 'Inventario', short: 'Autos',   icon: Car,             group: 'Catálogo' },
  { href: '/admin/redes',      label: 'Redes sociales', short: 'Redes', icon: ImagePlus,     group: 'Catálogo' },
  { href: '/admin/vendedores', label: 'Vendedores', short: 'Vend.',   icon: Users,           group: 'Vendedores' },
  { href: '/admin/cuentas',    label: 'Cuentas',                      icon: KeyRound,        group: 'Vendedores' },
  { href: '/admin/formulario', label: 'Formularios impresos', short: 'Formatos', icon: FileText, group: 'Herramientas' },
]

export function AdminSidebar() {
  return <PortalNav nav={NAV} homeHref="/admin/dashboard" cta={{ href: '/admin/inventario/nuevo', label: 'Publicar auto' }} />
}
