'use client'

import { Car, Users, LayoutDashboard, FileText, KeyRound } from 'lucide-react'
import { PortalNav, type PortalNavItem } from '@/components/ui/portal-nav'

const NAV: PortalNavItem[] = [
  { href: '/admin/dashboard',  label: 'Dashboard',  short: 'Inicio',  icon: LayoutDashboard },
  { href: '/admin/inventario', label: 'Inventario', short: 'Autos',   icon: Car },
  { href: '/admin/vendedores', label: 'Vendedores',                   icon: Users },
  { href: '/admin/cuentas',    label: 'Cuentas',                      icon: KeyRound },
  { href: '/admin/formulario', label: 'Formulario', short: 'Formatos', icon: FileText },
]

export function AdminSidebar() {
  return <PortalNav nav={NAV} homeHref="/admin/dashboard" />
}
