import Link from 'next/link'
import { ArrowUpRight, BadgeCheck, ChevronRight, FolderLock, Plus, User } from 'lucide-react'
import { requireSeller } from '@/lib/supabase/current-seller'

export const metadata = { title: 'Más — LoteCUU' }

/** Phone menu for the sections that don't fit in the tab bar */
export default async function VendorMasPage() {
  const { seller } = await requireSeller()
  const items = [
    { href: '/vendedor/inventario/nuevo', label: 'Publicar auto', icon: Plus },
    { href: '/vendedor/documentos', label: 'Documentos', icon: FolderLock },
    { href: '/vendedor/perfil', label: 'Mi perfil', icon: User },
    { href: '/vendedor/plan', label: 'Mi plan', icon: BadgeCheck },
  ]
  return (
    <div className="p-4 md:p-8 max-w-xl flex flex-col gap-4">
      <h1 className="text-[22px] font-[600] tracking-tight m-0">Más</h1>
      <nav className="bg-white rounded-[6px] overflow-hidden" style={{ border: '0.5px solid var(--gray-line)' }}>
        {items.map(({ href, label, icon: Icon }, i) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-4 h-14 text-[15px] active:bg-surface-alt"
            style={{ borderTop: i ? '0.5px solid var(--gray-line)' : undefined }}
          >
            <Icon size={18} className="text-text-muted" />
            <span className="flex-1">{label}</span>
            <ChevronRight size={16} className="text-text-muted" />
          </Link>
        ))}
        {seller.active && (
          <Link
            href={`/vendedores/${seller.slug}`}
            target="_blank"
            className="flex items-center gap-3 px-4 h-14 text-[15px] active:bg-surface-alt"
            style={{ borderTop: '0.5px solid var(--gray-line)' }}
          >
            <ArrowUpRight size={18} className="text-text-muted" />
            <span className="flex-1">Ver mi página pública</span>
          </Link>
        )}
      </nav>
    </div>
  )
}
