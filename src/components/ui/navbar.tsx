import Link from 'next/link'
import { Logo } from '@/components/ui/logo'

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-5 md:px-10 py-3.5 bg-surface border-b-hairline border-[var(--gray-line)]">
      <Logo size="md" />
      <nav className="hidden md:flex items-center gap-7">
        <Link
          href="/autos"
          className="text-[14px] font-[500] text-text-base hover:text-dark transition-colors"
        >
          Autos
        </Link>
        <Link
          href="/vendedores"
          className="text-[14px] text-text-muted hover:text-text-base transition-colors"
        >
          Vendedores
        </Link>
      </nav>
      <div className="hidden md:flex items-center gap-2.5">
        <Link
          href="/publicar"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-pill text-[13px] font-[500] bg-orange text-white hover:bg-orange-deep transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Publicar auto
        </Link>
      </div>
      <button className="md:hidden p-1.5 text-text-base" aria-label="Menú">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
    </header>
  )
}
