import Link from 'next/link'
import Image from 'next/image'
import { format, startOfMonth, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  AlertCircle, ArrowUpRight, CheckCircle2, Circle, Eye, ImagePlus, Plus, Tag, User, Wallet,
} from 'lucide-react'
import { ACTIVE_STATUSES, requireSeller } from '@/lib/supabase/current-seller'
import { sortPhotos } from '@/lib/photo-angles'
import { fmtPrice } from '@/lib/format'
import { CarPlaceholder } from '@/components/ui/car-placeholder'
import type { VehiclePrivate, VehicleStatus } from '@/lib/supabase/database.types'

export const metadata = { title: 'Inicio — LoteCUU' }

type Photo = { url: string; is_cover: boolean; sort_order: number; angle: string | null }
type Row = {
  id: string; title: string; status: VehicleStatus; price: number | null; year: number | null
  slug: string; photos: Photo[]
}

const DAYS = 14

export default async function VendorHomePage() {
  const { supabase, seller } = await requireSeller()

  const { data } = await supabase
    .from('vehicles')
    .select('id, title, status, price, year, slug, photos:vehicle_photos(url, is_cover, sort_order, angle)')
    .eq('seller_id', seller.id)
    .order('created_at', { ascending: false })
  const cars = (data ?? []) as unknown as Row[]
  const ids = cars.map((c) => c.id)

  const since = subDays(new Date(), 30)
  const [eventsRes, privRes] = ids.length
    ? await Promise.all([
        supabase
          .from('vehicle_events')
          .select('vehicle_id, created_at')
          .in('vehicle_id', ids)
          .eq('event_type', 'view')
          .gte('created_at', since.toISOString())
          .limit(10000),
        supabase.from('vehicle_private').select('*').in('vehicle_id', ids),
      ])
    : [{ data: [] }, { data: [] }]
  const events = (eventsRes.data ?? []) as { vehicle_id: string; created_at: string }[]
  const priv = new Map(((privRes.data ?? []) as VehiclePrivate[]).map((p) => [p.vehicle_id, p]))

  /* ── Numbers ── */
  const published = cars.filter((c) => c.status === 'published' || c.status === 'reserved')
  const activeCount = cars.filter((c) => (ACTIVE_STATUSES as readonly string[]).includes(c.status)).length
  const monthStart = startOfMonth(new Date())
  const soldThisMonth = cars.filter((c) => {
    const at = priv.get(c.id)?.sold_at
    return c.status === 'sold' && at && new Date(at) >= monthStart
  })
  const monthRevenue = soldThisMonth.reduce((s, c) => s + (priv.get(c.id)?.sale_price ?? c.price ?? 0), 0)
  const monthProfit = soldThisMonth.reduce((s, c) => {
    const p = priv.get(c.id)
    const cost = (p?.purchase_price ?? 0) + (p?.extra_costs ?? 0)
    const sale = p?.sale_price ?? c.price
    return cost > 0 && sale ? s + (sale - cost) : s
  }, 0)

  // Views per day (last 14) and per car (last 30)
  const perDay = Array.from({ length: DAYS }, () => 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const perCar = new Map<string, number>()
  for (const e of events) {
    perCar.set(e.vehicle_id, (perCar.get(e.vehicle_id) ?? 0) + 1)
    const d = new Date(e.created_at)
    d.setHours(0, 0, 0, 0)
    const ago = Math.round((today.getTime() - d.getTime()) / 86400000)
    if (ago >= 0 && ago < DAYS) perDay[DAYS - 1 - ago]++
  }
  const views30 = events.length
  const views14 = perDay.reduce((a, b) => a + b, 0)
  const topCars = cars
    .filter((c) => perCar.get(c.id))
    .sort((a, b) => (perCar.get(b.id) ?? 0) - (perCar.get(a.id) ?? 0))
    .slice(0, 5)
  const topMax = Math.max(1, ...topCars.map((c) => perCar.get(c.id) ?? 0))

  /* ── Setup checklist ── */
  const steps = [
    { done: !!seller.whatsapp, label: 'Agrega tu WhatsApp', href: '/vendedor/perfil' },
    { done: !!(seller.logo_url || seller.profile_photo_url), label: 'Sube tu logo o una foto', href: '/vendedor/perfil' },
    { done: !!seller.description, label: 'Describe tu negocio en tu perfil', href: '/vendedor/perfil' },
    { done: cars.some((c) => c.status !== 'draft'), label: 'Publica tu primer auto', href: '/vendedor/inventario/nuevo' },
    { done: cars.length > 0 && cars.every((c) => c.photos.length >= 4), label: 'Sube al menos 4 fotos a cada auto', href: '/vendedor/inventario' },
  ]
  const stepsDone = steps.filter((s) => s.done).length

  /* ── Things to fix ── */
  const issues: { id: string; title: string; text: string; href: string }[] = []
  for (const c of cars) {
    if (c.status === 'sold') continue
    const edit = `/vendedor/inventario/${c.id}/editar`
    if (!c.photos.length) issues.push({ id: c.id, title: c.title, text: 'No tiene fotos', href: edit })
    else if (c.photos.length < 4) issues.push({ id: c.id, title: c.title, text: `Solo ${c.photos.length} ${c.photos.length === 1 ? 'foto' : 'fotos'} — sube más`, href: edit })
    if (!c.price) issues.push({ id: c.id, title: c.title, text: 'Sin precio', href: edit })
    if (c.status === 'draft') issues.push({ id: c.id, title: c.title, text: 'Es borrador: aún no se ve en el catálogo', href: edit })
    if (c.status === 'reserved') issues.push({ id: c.id, title: c.title, text: 'Apartado — ¿ya se vendió? Regístralo', href: edit })
  }

  const displayName = seller.business_name ?? seller.name
  const cover = (c: Row) => sortPhotos(c.photos)[0]?.url

  return (
    <div className="p-4 md:p-8 max-w-6xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[12px] text-text-muted m-0 first-letter:uppercase">{format(new Date(), "EEEE d 'de' MMMM", { locale: es })}</p>
          <h1 className="text-[24px] md:text-[30px] font-[600] tracking-tight m-0 mt-1">Hola, {displayName}</h1>
        </div>
        {seller.active && (
          <Link
            href={`/vendedores/${seller.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[4px] bg-white text-[13px] font-[500] hover:bg-surface-alt transition-colors"
            style={{ border: '0.5px solid var(--gray-line-strong)' }}
          >
            Ver mi página pública
            <ArrowUpRight size={14} />
          </Link>
        )}
      </div>

      {/* Setup checklist */}
      {stepsDone < steps.length && (
        <section className="bg-white rounded-[6px] p-4 md:p-5 flex flex-col gap-4" style={{ border: '0.5px solid var(--gray-line)' }}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-[15px] font-[600] m-0">Deja tu perfil listo para vender</h2>
              <p className="text-[12.5px] text-text-muted m-0 mt-0.5">Los perfiles completos generan más confianza y más mensajes.</p>
            </div>
            <span className="text-[12px] text-text-muted tabular-nums">{stepsDone} de {steps.length} listos</span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-alt overflow-hidden">
            <div className="h-full bg-teal rounded-full" style={{ width: `${(stepsDone / steps.length) * 100}%` }} />
          </div>
          <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1 m-0 p-0 list-none">
            {steps.map((s) => (
              <li key={s.label}>
                {s.done ? (
                  <span className="flex items-center gap-2 py-1.5 text-[13.5px] text-text-muted line-through decoration-1">
                    <CheckCircle2 size={16} className="text-teal shrink-0" /> {s.label}
                  </span>
                ) : (
                  <Link href={s.href} className="flex items-center gap-2 py-1.5 text-[13.5px] hover:text-teal transition-colors">
                    <Circle size={16} className="text-gray-mid shrink-0" /> {s.label}
                    <ArrowUpRight size={13} className="text-text-muted" />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="En el catálogo" value={String(published.length)} sub={`${activeCount} de ${seller.max_vehicles} lugares de tu plan`}>
          <div className="h-1 rounded-full bg-surface-alt overflow-hidden mt-2">
            <div className="h-full rounded-full bg-orange" style={{ width: `${Math.min(100, (activeCount / Math.max(1, seller.max_vehicles)) * 100)}%` }} />
          </div>
        </Kpi>
        <Kpi label="Vistas · 30 días" value={views30.toLocaleString('es-MX')} sub={`${views14} en las últimas 2 semanas`}>
          <ViewsBars days={perDay} />
        </Kpi>
        <Kpi label="Vendidos este mes" value={String(soldThisMonth.length)} sub={monthRevenue ? `${fmtPrice(monthRevenue)} en ventas` : 'Registra tus ventas en cada auto'} />
        <Kpi
          label="Ganancia del mes"
          value={monthProfit ? fmtPrice(monthProfit) : '—'}
          sub={monthProfit ? 'De las ventas con costos registrados' : 'Anota costos y ventas para verla'}
          tone={monthProfit > 0 ? 'var(--color-teal)' : monthProfit < 0 ? '#dc2626' : undefined}
        />
      </section>

      {/* Quick actions */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Action href="/vendedor/inventario/nuevo" icon={Plus} label="Publicar auto" primary />
        <Action href="/vendedor/redes" icon={ImagePlus} label="Crear post para redes" />
        <Action href="/vendedor/ventas" icon={Wallet} label="Ventas y ganancias" />
        <Action href="/vendedor/perfil" icon={User} label="Editar mi perfil" />
      </section>

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        {/* Attention */}
        <section className="bg-white rounded-[6px] overflow-hidden" style={{ border: '0.5px solid var(--gray-line)' }}>
          <header className="px-4 md:px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: '0.5px solid var(--gray-line)' }}>
            <h2 className="text-[14px] font-[600] m-0">Necesita tu atención</h2>
            {issues.length > 0 && <span className="text-[12px] text-text-muted tabular-nums">{issues.length}</span>}
          </header>
          {issues.length === 0 ? (
            <p className="px-5 py-8 text-center text-[13.5px] text-text-muted m-0 flex items-center justify-center gap-2">
              <CheckCircle2 size={16} className="text-teal" /> Todo en orden con tus autos.
            </p>
          ) : (
            <ul className="m-0 p-0 list-none">
              {issues.slice(0, 8).map((it, i) => (
                <li key={it.id + it.text} style={{ borderTop: i ? '0.5px solid var(--gray-line)' : undefined }}>
                  <Link href={it.href} className="flex items-start gap-3 px-4 md:px-5 py-3 hover:bg-surface transition-colors">
                    <AlertCircle size={16} className="text-orange shrink-0 mt-0.5" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13.5px] font-[500] truncate">{it.title}</span>
                      <span className="block text-[12.5px] text-text-muted">{it.text}</span>
                    </span>
                    <ArrowUpRight size={14} className="text-text-muted shrink-0 mt-1" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Most viewed */}
        <section className="bg-white rounded-[6px] overflow-hidden" style={{ border: '0.5px solid var(--gray-line)' }}>
          <header className="px-4 md:px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: '0.5px solid var(--gray-line)' }}>
            <h2 className="text-[14px] font-[600] m-0">Lo más visto · 30 días</h2>
            <Eye size={15} className="text-text-muted" />
          </header>
          {topCars.length === 0 ? (
            <p className="px-5 py-8 text-center text-[13.5px] text-text-muted m-0">
              Aún no hay visitas. Comparte tus autos en redes para atraer compradores.
            </p>
          ) : (
            <ul className="m-0 p-0 list-none">
              {topCars.map((c, i) => {
                const n = perCar.get(c.id) ?? 0
                const src = cover(c)
                return (
                  <li key={c.id} style={{ borderTop: i ? '0.5px solid var(--gray-line)' : undefined }}>
                    <Link href={`/vendedor/inventario/${c.id}/editar`} className="flex items-center gap-3 px-4 md:px-5 py-3 hover:bg-surface transition-colors">
                      <span className="relative w-14 h-10 rounded-[3px] overflow-hidden bg-surface-alt shrink-0">
                        {src ? <Image src={src} alt="" fill sizes="56px" className="object-cover" /> : <CarPlaceholder seed={c.id} className="w-full h-full" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13.5px] font-[500] truncate">{c.title}</span>
                        <span className="mt-1.5 block h-1 rounded-full bg-surface-alt overflow-hidden">
                          <span className="block h-full rounded-full bg-teal" style={{ width: `${(n / topMax) * 100}%` }} />
                        </span>
                      </span>
                      <span className="text-[13px] font-[500] tabular-nums w-12 text-right">{n}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      <p className="text-[12px] text-text-muted m-0 flex items-center gap-1.5">
        <Tag size={12} /> Tip: los autos con 8 fotos o más y precio visible reciben más mensajes.
      </p>
    </div>
  )
}

function Kpi({
  label, value, sub, tone, children,
}: { label: string; value: string; sub: string; tone?: string; children?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[6px] px-4 py-4 flex flex-col gap-1 min-w-0" style={{ border: '0.5px solid var(--gray-line)' }}>
      <span className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500]">{label}</span>
      <span className="text-[24px] font-[600] tracking-tight tabular-nums leading-tight" style={{ color: tone }}>{value}</span>
      <span className="text-[11.5px] text-text-muted leading-snug">{sub}</span>
      {children}
    </div>
  )
}

function ViewsBars({ days }: { days: number[] }) {
  const max = Math.max(1, ...days)
  return (
    <div className="flex items-end gap-[3px] h-8 mt-2" role="img" aria-label={`Vistas por día, últimos ${days.length} días`}>
      {days.map((n, i) => (
        <span
          key={i}
          className="flex-1 rounded-[1px]"
          style={{ height: `${Math.max(6, (n / max) * 100)}%`, background: n ? 'var(--color-teal)' : 'var(--color-surface-alt)' }}
          title={`${n} ${n === 1 ? 'vista' : 'vistas'}`}
        />
      ))}
    </div>
  )
}

function Action({
  href, icon: Icon, label, primary,
}: { href: string; icon: React.ComponentType<{ size?: number }>; label: string; primary?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-4 h-14 rounded-[6px] text-[13.5px] font-[500] transition-colors ${
        primary ? 'bg-orange text-white hover:bg-orange-deep' : 'bg-white hover:bg-surface-alt'
      }`}
      style={primary ? undefined : { border: '0.5px solid var(--gray-line)' }}
    >
      <Icon size={17} />
      <span className="leading-tight">{label}</span>
    </Link>
  )
}
