import Link from 'next/link'
import Image from 'next/image'
import { subDays } from 'date-fns'
import { Plus, Pencil, Star, Camera, Eye, ImagePlus } from 'lucide-react'
import { ACTIVE_STATUSES, requireSeller } from '@/lib/supabase/current-seller'
import { StatusPill } from '@/components/ui/status-pill'
import { CarPlaceholder } from '@/components/ui/car-placeholder'
import { sortPhotos } from '@/lib/photo-angles'
import { fmtPrice, fmtKm } from '@/lib/format'
import type { VehicleStatus } from '@/lib/supabase/database.types'

export const metadata = { title: 'Mis autos — LoteCUU' }

type Photo = { url: string; is_cover: boolean; sort_order: number; angle: string | null }
type Row = {
  id: string
  title: string
  status: VehicleStatus
  year: number | null
  price: number | null
  mileage: number | null
  slug: string
  featured: boolean
  photos: Photo[]
}

const VIEWS = [
  { key: 'todos', label: 'Todos' },
  { key: 'venta', label: 'En venta' },
  { key: 'borradores', label: 'Borradores' },
  { key: 'vendidos', label: 'Vendidos' },
] as const

export default async function VendorInventarioPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string }>
}) {
  const { vista = 'todos' } = await searchParams
  const { supabase, seller } = await requireSeller()

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, title, status, year, price, mileage, slug, featured, photos:vehicle_photos(url, is_cover, sort_order, angle)')
    .eq('seller_id', seller.id)
    .order('created_at', { ascending: false })
  const all = (vehicles ?? []) as unknown as Row[]
  const ids = all.map((v) => v.id)

  const { data: events } = ids.length
    ? await supabase
        .from('vehicle_events')
        .select('vehicle_id')
        .in('vehicle_id', ids)
        .eq('event_type', 'view')
        .gte('created_at', subDays(new Date(), 30).toISOString())
        .limit(10000)
    : { data: [] }
  const views = new Map<string, number>()
  for (const e of (events ?? []) as { vehicle_id: string }[]) views.set(e.vehicle_id, (views.get(e.vehicle_id) ?? 0) + 1)

  const activeCount = all.filter((v) => (ACTIVE_STATUSES as readonly string[]).includes(v.status)).length
  const atLimit = activeCount >= seller.max_vehicles
  const featuredCount = all.filter((v) => v.featured).length
  const profileIncomplete = !seller.whatsapp

  const groups = {
    todos: all,
    venta: all.filter((v) => v.status === 'published' || v.status === 'reserved'),
    borradores: all.filter((v) => v.status === 'draft' || v.status === 'hidden'),
    vendidos: all.filter((v) => v.status === 'sold'),
  }
  const shown = groups[vista as keyof typeof groups] ?? all
  const cols = '64px 1fr 108px 120px 64px 72px 168px'
  const cover = (v: Row) => sortPhotos(v.photos)[0]?.url

  return (
    <div className="p-4 md:p-8 max-w-6xl">
      {profileIncomplete && (
        <div
          className="mb-6 px-4 py-3.5 rounded-[6px] text-[13px] flex items-center justify-between gap-3 flex-wrap"
          style={{ background: '#fff8f0', border: '0.5px solid #fde4c4', color: '#92400e' }}
        >
          <span>Completa tu perfil (nombre y WhatsApp) antes de publicar: es lo que verán los compradores.</span>
          <Link href="/vendedor/perfil" className="shrink-0 inline-flex items-center h-8 px-4 rounded-[4px] text-[12px] font-[500] bg-orange text-white hover:bg-orange-deep transition-colors">
            Completar perfil
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-[22px] md:text-[28px] font-[600] tracking-tight m-0">Mis autos</h1>
          <div className="flex items-center gap-x-5 gap-y-2 mt-2 flex-wrap text-[12px] text-text-muted">
            <span className="inline-flex items-center gap-2">
              <span className="w-28 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${Math.min((activeCount / Math.max(seller.max_vehicles, 1)) * 100, 100)}%`, background: atLimit ? '#ef4444' : '#FB9833' }}
                />
              </span>
              <strong className={atLimit ? 'text-red-500' : 'text-text-base'}>{activeCount}</strong>/{seller.max_vehicles} autos
            </span>
            <span className="inline-flex items-center gap-1">
              <Star size={12} className="text-orange" />
              <strong className="text-text-base">{featuredCount}</strong>/{seller.max_featured ?? 0} destacados
            </span>
          </div>
        </div>
        {atLimit ? (
          <Link href="/vendedor/plan" className="inline-flex items-center gap-2 h-10 px-5 rounded-[4px] text-[13px] font-[500] bg-gray-100 text-text-muted">
            Límite alcanzado · ver plan
          </Link>
        ) : (
          <Link href="/vendedor/inventario/nuevo" className="inline-flex items-center gap-2 h-10 px-5 bg-orange text-white rounded-[4px] text-[13px] font-[500] hover:bg-orange-deep transition-colors">
            <Plus size={14} />
            Publicar auto
          </Link>
        )}
      </div>

      {/* View tabs */}
      <div className="flex gap-1 mb-3 overflow-x-auto -mx-1 px-1">
        {VIEWS.map((t) => (
          <Link
            key={t.key}
            href={`/vendedor/inventario${t.key === 'todos' ? '' : `?vista=${t.key}`}`}
            className="shrink-0 px-3.5 py-1.5 rounded-[4px] text-[13px] font-[500] transition-colors"
            style={vista === t.key ? { background: '#012538', color: '#fff' } : { color: 'var(--color-text-muted)' }}
          >
            {t.label} <span className="opacity-60 tabular-nums">{groups[t.key].length}</span>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-[6px] overflow-hidden" style={{ border: '0.5px solid var(--gray-line)' }}>
        <div
          className="hidden md:grid gap-4 text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500] px-5 py-3"
          style={{ gridTemplateColumns: cols, background: 'var(--color-surface-alt)', borderBottom: '0.5px solid var(--gray-line)' }}
        >
          <span /><span>Vehículo</span><span>Estado</span><span>Precio</span><span>Fotos</span><span>Vistas</span><span />
        </div>

        {shown.length === 0 && (
          <div className="px-5 py-12 text-center text-[14px] text-text-muted">
            {vista === 'vendidos' ? 'Aún no registras ventas.' : vista === 'borradores' ? 'No tienes borradores.' : 'Aún no tienes autos registrados.'}
          </div>
        )}

        {shown.map((v, i) => {
          const src = cover(v)
          const n = v.photos.length
          const seen = views.get(v.id) ?? 0
          const thumb = (
            <span className="relative block w-16 h-12 rounded-[3px] overflow-hidden bg-surface-alt shrink-0">
              {src ? <Image src={src} alt="" fill sizes="64px" className="object-cover" /> : <CarPlaceholder seed={v.id} className="w-full h-full" />}
            </span>
          )
          return (
            <div key={v.id} style={{ borderTop: i === 0 ? 'none' : '0.5px solid var(--gray-line)', opacity: v.status === 'sold' ? 0.75 : 1 }}>
              {/* Phone */}
              <div className="md:hidden flex flex-col gap-3 px-4 py-3.5">
                <Link href={`/vendedor/inventario/${v.id}/editar`} className="flex items-start gap-3">
                  {thumb}
                  <span className="min-w-0 flex-1">
                    <span className="text-[15px] font-[500] truncate flex items-center gap-1.5">
                      {v.featured && <Star size={12} className="text-orange shrink-0" fill="currentColor" />}
                      {v.title}
                    </span>
                    <span className="block text-[12px] text-text-muted mt-0.5">
                      {[v.year, v.mileage ? fmtKm(v.mileage) : null].filter(Boolean).join(' · ')}
                    </span>
                    <span className="flex items-center gap-2 flex-wrap mt-1.5">
                      <StatusPill status={v.status} />
                      {v.price ? <span className="text-[14px] font-[500] tabular-nums">{fmtPrice(v.price)}</span> : null}
                    </span>
                  </span>
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-text-muted inline-flex items-center gap-1 mr-auto">
                    <Camera size={12} /> {n} · <Eye size={12} /> {seen}
                  </span>
                  <Link href={`/vendedor/redes/${v.id}`} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[4px] text-[12px] font-[500]" style={{ border: '0.5px solid var(--gray-line-strong)' }}>
                    <ImagePlus size={12} /> Post
                  </Link>
                  <Link href={`/vendedor/inventario/${v.id}/editar`} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[4px] text-[12px] font-[500] bg-text-base text-white">
                    <Pencil size={12} /> Editar
                  </Link>
                </div>
              </div>

              {/* Desktop */}
              <div className="hidden md:grid items-center px-5 py-3 gap-4" style={{ gridTemplateColumns: cols }}>
                {thumb}
                <div className="min-w-0">
                  <div className="text-[14px] font-[500] truncate flex items-center gap-1.5">
                    {v.featured && <Star size={12} className="text-orange shrink-0" fill="currentColor" />}
                    {v.title}
                  </div>
                  <div className="text-[12px] text-text-muted mt-0.5">
                    {[v.year, v.mileage ? fmtKm(v.mileage) : null].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <StatusPill status={v.status} />
                <div className="text-[13px] font-[500] tabular-nums">
                  {v.price ? fmtPrice(v.price) : <span className="text-orange font-[400]">Sin precio</span>}
                </div>
                <div className="text-[13px] tabular-nums inline-flex items-center gap-1" style={{ color: n < 4 ? 'var(--color-orange-deep)' : 'var(--color-text-muted)' }}>
                  <Camera size={13} /> {n}
                </div>
                <div className="text-[13px] text-text-muted tabular-nums inline-flex items-center gap-1">
                  <Eye size={13} /> {seen}
                </div>
                <div className="flex justify-end gap-1.5">
                  <Link
                    href={`/vendedor/redes/${v.id}`}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[4px] text-[12px] font-[500] transition-colors hover:bg-surface-alt"
                    style={{ border: '0.5px solid var(--gray-line-strong)' }}
                  >
                    <ImagePlus size={12} /> Post
                  </Link>
                  <Link
                    href={`/vendedor/inventario/${v.id}/editar`}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[4px] text-[12px] font-[500] transition-colors hover:bg-surface-alt"
                    style={{ border: '0.5px solid var(--gray-line-strong)' }}
                  >
                    <Pencil size={12} /> Editar
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-[12px] text-text-muted mt-3">Vistas de los últimos 30 días. Inversión y ganancias están en «Ventas y ganancias».</p>
    </div>
  )
}
