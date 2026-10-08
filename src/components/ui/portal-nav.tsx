'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, type LucideIcon } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { signOut } from '@/app/admin/actions'

export interface PortalNavItem {
  href: string
  label: string
  /** Shorter label for the mobile tab bar */
  short?: string
  icon: LucideIcon
}

/**
 * Navigation for the admin and seller portals.
 * - Desktop (md+): fixed left sidebar.
 * - Phone: slim top bar (logo + sign out) and a bottom tab bar within
 *   thumb reach, respecting the home-indicator safe area.
 */
export function PortalNav({
  nav,
  homeHref,
  sidebarExtra,
  topBarExtra,
}: {
  nav: PortalNavItem[]
  homeHref: string
  sidebarExtra?: React.ReactNode
  topBarExtra?: React.ReactNode
}) {
  const pathname = usePathname()
  const isActive = (href: string) => pathname.startsWith(href)

  const signOutButton = (compact: boolean) => (
    <form action={signOut}>
      <button
        type="submit"
        aria-label="Cerrar sesión"
        className={
          compact
            ? 'w-10 h-10 rounded-[4px] flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors'
            : 'flex items-center gap-2.5 w-full px-3 py-2.5 rounded-[4px] text-[13px] font-[500] text-white/50 hover:text-white/80 transition-colors'
        }
      >
        <LogOut size={compact ? 17 : 15} />
        {!compact && 'Cerrar sesión'}
      </button>
    </form>
  )

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col sticky top-0 h-screen" style={{ background: '#012538' }}>
        <div className="flex items-center px-4 py-5" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.10)' }}>
          <Logo variant="dark" size="sm" href={homeHref} />
        </div>
        {sidebarExtra}
        <nav className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-[4px] text-[13px] font-[500] transition-colors"
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
          {signOutButton(false)}
        </div>
      </aside>

      {/* ── Phone top bar ── */}
      <header
        className="md:hidden sticky top-0 z-40 flex items-center justify-between gap-3 pl-4 pr-2 h-14"
        style={{ background: '#012538', borderBottom: '0.5px solid rgba(255,255,255,0.10)' }}
      >
        <Logo variant="dark" size="sm" href={homeHref} />
        <div className="flex items-center gap-1 min-w-0">
          {topBarExtra}
          {signOutButton(true)}
        </div>
      </header>

      {/* ── Phone bottom tabs ── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 grid"
        style={{
          gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))`,
          background: '#012538',
          borderTop: '0.5px solid rgba(255,255,255,0.12)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        aria-label="Navegación"
      >
        {nav.map(({ href, label, short, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className="relative flex flex-col items-center justify-center gap-1 h-[62px] text-[10.5px] font-[500] transition-colors"
              style={{ color: active ? '#FBB96A' : 'rgba(255,255,255,0.6)' }}
            >
              {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-orange" />}
              <Icon size={19} />
              <span className="truncate max-w-full px-1">{short ?? label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
