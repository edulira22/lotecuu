import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, Pencil, FileText, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { StatusPill } from '@/components/ui/status-pill'
import { fmtPrice, fmtKm } from '@/lib/format'
import type { Seller, VehiclePrivate, VehicleStatus } from '@/lib/supabase/database.types'

export const metadata = { title: 'Mis autos — LoteCUU' }

type Row = {
  id: string
  title: string
  status: VehicleStatus
  year: number | null
  price: number | null
  mileage: number | null
  slug: string
  featured: boolean
}

const VIEWS = [
  { key: 'todos', label: 'Todos' },
  { key: 'venta', label: 'En venta' },
  { key: 'vendidos', label: 'Vendidos' },
] as const

export default async function VendorInventarioPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string }>
}) {
  const { vista = 'todos' } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sellerData } = await supabase
    .from('sellers').select('*').eq('auth_user_id', user.id).maybeSingle()
  if (!sellerData) redirect('/login')
  const seller = sellerData as unknown as Seller

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, title, status, year, price, mileage, slug, featured')
    .eq('seller_id', seller.id)
    .order('created_at', { ascending: false })

  const all = (vehicles ?? []) as Row[]
  const ids = all.map((v) => v.id)

  // Private numbers + document counts (tables from migration 006 — optional)
  const [privRes, docsRes] = ids.length
    ? await Promise.all([
        supabase.from('vehicle_private').select('*').in('vehicle_id', ids),
        supabase.from('vehicle_documents').select('vehicle_id').in('vehicle_id', ids),
      ])
    : [{ data: [], error: null }, { data: [], error: null }]
  const toolsReady = !privRes.error && !docsRes.error
  const priv = new Map<string, VehiclePrivate>(((privRes.data ?? []) as VehiclePrivate[]).map((p) => [p.vehicle_id, p]))
  const docCount = new Map<string, number>()
  for (const d of (docsRes.data ?? []) as { vehicle_id: string }[]) {
    docCount.set(d.vehicle_id, (docCount.get(d.vehicle_id) ?? 0) + 1)
  }

  const cost = (id: string) => {
    const p = priv.get(id)
    const total = (p?.purchase_price ?? 0) + (p?.extra_costs ?? 0)
    return total > 0 ? total : null
  }
  const salePrice = (v: Row) => priv.get(v.id)?.sale_price ?? (v.status === 'sold' ? v.price : null)

  // ── Summary ──
  const forSale = all.filter((v) => v.status === 'published' || v.status === 'reserved')
  const sold = all.filter((v) => v.status === 'sold')
  const unsold = all.filter((v) => v.status !== 'sold')
  const listValue = forSale.reduce((s, v) => s + (v.price ?? 0), 0)
  const invested = unsold.reduce((s, v) => s + (cost(v.id) ?? 0), 0)
  const revenue = sold.reduce((s, v) => s + (salePrice(v) ?? 0), 0)
  const realized = sold.reduce((s, v) => {
    const c = cost(v.id)
    const p = salePrice(v)
    return c !== null && p !== null ? s + (p - c) : s
  }, 0)

  const activeCount = all.filter((v) => ['published', 'reserved', 'hidden', 'draft'].includes(v.status)).length
  const atLimit = activeCount >= seller.max_vehicles
  const featuredCount = all.filter((v) => v.featured).length
  const profileIncomplete = !seller.whatsapp

  const shown = vista === 'venta' ? unsold : vista === 'vendidos' ? sold : all
  const cols = '1fr 104px 108px 108px 118px 56px 84px'

  return (
    <div className="p-8 max-w-6xl">
      {profileIncomplete && (
        <div
          className="mb-6 px-4 py-3.5 rounded-[6px] text-[13px] flex items-center justify-between gap-3 flex-wrap"
          style={{ background: '#fff8f0', border: '0.5px solid #fde4c4', color: '#92400e' }}
        >
          <span>Completa tu perfil (nombre y WhatsApp) antes de publicar un auto — es lo que verán los compradores.</span>
          <Link href="/vendedor/perfil" className="shrink-0 inline-flex items-center h-8 px-4 rounded-[4px] text-[12px] font-[500] bg-orange text-white hover:bg-orange-deep transition-colors">
            Completar perfil
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-[28px] font-[600] tracking-tight m-0">Mis autos</h1>
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
          <div className="inline-flex items-center gap-2 h-10 px-5 rounded-[4px] text-[13px] font-[500] bg-gray-100 text-text-muted cursor-not-allowed">
            Límite alcanzado
          </div>
        ) : (
          <Link href="/vendedor/inventario/nuevo" className="inline-flex items-center gap-2 h-10 px-5 bg-orange text-white rounded-[4px] text-[13px] font-[500] hover:bg-orange-deep transition-colors">
            <Plus size={14} />
            Agregar auto
          </Link>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 bg-white rounded-[6px] overflow-hidden mb-6" style={{ border: '0.5px solid var(--gray-line)' }}>
        {[
          { label: 'En venta', value: String(forSale.length), sub: listValue ? `${fmtPrice(listValue)} publicados` : 'Sin autos publicados' },
          { label: 'Invertido en inventario', value: invested ? fmtPrice(invested) : '—', sub: toolsReady ? 'Compra + gastos de lo no vendido' : 'Registra costos en cada auto' },
          { label: 'Vendidos', value: String(sold.length), sub: revenue ? `${fmtPrice(revenue)} en ventas` : 'Aún sin ventas' },
          { label: 'Ganancia realizada', value: realized ? fmtPrice(realized) : '—', sub: 'Ventas con costos registrados', tone: realized > 0 ? 'var(--color-teal)' : realized < 0 ? '#dc2626' : undefined },
        ].map((s, i) => (
          <div
            key={s.label}
            className="px-5 py-4 flex flex-col gap-1"
            style={{ borderLeft: i % 2 ? '0.5px solid var(--gray-line)' : i ? '0.5px solid var(--gray-line)' : 'none', borderTop: i >= 2 ? '0.5px solid var(--gray-line)' : 'none' }}
          >
            <span className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500]">{s.label}</span>
            <span className="text-[22px] font-[600] tracking-tight tabular-nums" style={{ color: s.tone }}>{s.value}</span>
            <span className="text-[11.5px] text-text-muted">{s.sub}</span>
          </div>
        ))}
      </div>

      {atLimit && (
        <div className="mb-5 px-4 py-3 rounded-[6px] text-[13px]" style={{ background: '#fef2f2', border: '0.5px solid #fecaca', color: '#991b1b' }}>
          Has alcanzado el límite de tu plan ({seller.max_vehicles} autos). Contacta al administrador para ampliar tu plan.
        </div>
      )}

      {/* View tabs */}
      <div className="flex gap-1 mb-3">
        {VIEWS.map((t) => {
          const n = t.key === 'venta' ? unsold.length : t.key === 'vendidos' ? sold.length : all.length
          return (
            <Link
              key={t.key}
              href={`/vendedor/inventario${t.key === 'todos' ? '' : `?vista=${t.key}`}`}
              className="px-3.5 py-1.5 rounded-[4px] text-[13px] font-[500] transition-colors"
              style={vista === t.key ? { background: '#012538', color: '#fff' } : { color: 'var(--color-text-muted)' }}
            >
              {t.label} <span className="opacity-60 tabular-nums">{n}</span>
            </Link>
          )
        })}
      </div>

      <div className="bg-white rounded-[6px] overflow-x-auto" style={{ border: '0.5px solid var(--gray-line)' }}>
        <div className="min-w-[760px]">
          <div
            className="grid text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500] px-5 py-3"
            style={{ gridTemplateColumns: cols, background: 'var(--color-surface-alt)', borderBottom: '0.5px solid var(--gray-line)' }}
          >
            <span>Vehículo</span><span>Estado</span><span>Precio</span><span>Inversión</span><span>Ganancia</span><span>Docs</span><span />
          </div>

          {shown.length === 0 && (
            <div className="px-5 py-12 text-center text-[14px] text-text-muted">
              {vista === 'vendidos' ? 'Aún no registras ventas.' : 'Aún no tienes autos registrados.'}
            </div>
          )}

          {shown.map((v, i) => {
            const c = cost(v.id)
            const ref = v.status === 'sold' ? salePrice(v) : v.price
            const profit = c !== null && ref ? ref - c : null
            const docs = docCount.get(v.id) ?? 0
            return (
              <div
                key={v.id}
                className="grid items-center px-5 py-4 gap-4"
                style={{ gridTemplateColumns: cols, borderTop: i === 0 ? 'none' : '0.5px solid var(--gray-line)', opacity: v.status === 'sold' ? 0.75 : 1 }}
              >
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
                  {v.status === 'sold' && salePrice(v) ? fmtPrice(salePrice(v)!) : v.price ? fmtPrice(v.price) : <span className="text-text-muted">—</span>}
                </div>
                <div className="text-[13px] tabular-nums text-text-muted">{c !== null ? fmtPrice(c) : '—'}</div>
                <div className="text-[13px] font-[500] tabular-nums" style={{ color: profit === null ? undefined : profit >= 0 ? 'var(--color-teal)' : '#dc2626' }}>
                  {profit !== null ? fmtPrice(profit) : <span className="text-text-muted font-[400]">—</span>}
                  {profit !== null && v.status !== 'sold' && <span className="block text-[10.5px] text-text-muted font-[400]">estimada</span>}
                </div>
                <div className="text-[13px] text-text-muted inline-flex items-center gap-1 tabular-nums">
                  <FileText size={13} /> {docs}
                </div>
                <div className="flex justify-end">
                  <Link
                    href={`/vendedor/inventario/${v.id}/editar`}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[4px] text-[12px] font-[500] transition-colors hover:bg-surface-alt"
                    style={{ border: '0.5px solid var(--gray-line-strong)' }}
                  >
                    <Pencil size={12} />
                    Abrir
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {!toolsReady && (
        <p className="text-[12px] text-text-muted mt-4">
          Las columnas de inversión, ganancia y documentos se activan cuando la administración corra la migración 006.
        </p>
      )}
    </div>
  )
}
