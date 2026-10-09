'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, Plus, type LucideIcon } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { signOut } from '@/app/admin/actions'

export interface PortalNavItem {
  href: string
  label: string
  /** Shorter label for the mobile tab bar */
  short?: string
  icon: LucideIcon
  /** Sidebar section heading this item sits under */
  group?: string
  /** Only active on this exact path (for the home item) */
  exact?: boolean
}

/**
 * Navigation for the admin and seller portals.
 * - Desktop (md+): fixed left sidebar, items grouped under small headings,
 *   optional primary action button on top.
 * - Phone: slim top bar (logo + sign out) and a bottom tab bar within
 *   thumb reach (its own, shorter list), respecting the home-indicator area.
 */
export function PortalNav({
  nav,
  tabs,
  homeHref,
  cta,
  sidebarExtra,
  topBarExtra,
}: {
  nav: PortalNavItem[]
  /** Phone tab bar items (defaults to `nav`); keep it to 5 */
  tabs?: PortalNavItem[]
  homeHref: string
  cta?: { href: string; label: string }
  sidebarExtra?: React.ReactNode
  topBarExtra?: React.ReactNode
}) {
  const pathname = usePathname()
  // The most specific matching item wins, so "/vendedor" doesn't light up everywhere
  const all = [...nav, ...(tabs ?? [])]
  const match = all
    .filter((i) => (i.exact ? pathname === i.href : pathname === i.href || pathname.startsWith(i.href + '/')))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href
  const isActive = (href: string) => href === match

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

  const groups: { title?: string; items: PortalNavItem[] }[] = []
  for (const item of nav) {
    const last = groups[groups.length - 1]
    if (last && last.title === item.group) last.items.push(item)
    else groups.push({ title: item.group, items: [item] })
  }
  const tabItems = tabs ?? nav

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col sticky top-0 h-screen" style={{ background: '#012538' }}>
        <div className="flex items-center px-4 py-5" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.10)' }}>
          <Logo variant="dark" size="sm" href={homeHref} />
        </div>
        {sidebarExtra}
        {cta && (
          <div className="px-3 pt-3">
            <Link
              href={cta.href}
              className="flex items-center justify-center gap-2 h-10 rounded-[4px] bg-orange text-white text-[13px] font-[500] hover:bg-orange-deep transition-colors"
            >
              <Plus size={15} />
              {cta.label}
            </Link>
          </div>
        )}
        <nav className="flex flex-col gap-4 p-3 flex-1 overflow-y-auto">
          {groups.map((g, gi) => (
            <div key={g.title ?? gi} className="flex flex-col gap-1">
              {g.title && (
                <div className="px-3 pt-1 pb-1 text-[10px] uppercase tracking-[0.14em] font-[500] text-white/35">{g.title}</div>
              )}
              {g.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-[4px] text-[13px] font-[500] transition-colors hover:bg-white/5"
                    style={{
                      background: active ? 'rgba(251,152,51,0.18)' : undefined,
                      color: active ? '#FBB96A' : 'rgba(255,255,255,0.75)',
                    }}
                  >
                    <Icon size={15} />
                    {label}
                  </Link>
                )
              })}
            </div>
          ))}
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
          gridTemplateColumns: `repeat(${tabItems.length}, minmax(0, 1fr))`,
          background: '#012538',
          borderTop: '0.5px solid rgba(255,255,255,0.12)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        aria-label="Navegación"
      >
        {tabItems.map(({ href, label, short, icon: Icon }) => {
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
