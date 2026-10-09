import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowUpRight } from 'lucide-react'
import { requireSeller } from '@/lib/supabase/current-seller'
import { fmtPrice } from '@/lib/format'
import { StatusPill } from '@/components/ui/status-pill'
import type { VehiclePrivate, VehicleStatus } from '@/lib/supabase/database.types'

export const metadata = { title: 'Ventas y ganancias — LoteCUU' }

type Row = { id: string; title: string; status: VehicleStatus; price: number | null; year: number | null }

export default async function VendorVentasPage() {
  const { supabase, seller } = await requireSeller()

  const { data } = await supabase
    .from('vehicles')
    .select('id, title, status, price, year')
    .eq('seller_id', seller.id)
    .order('created_at', { ascending: false })
  const cars = (data ?? []) as Row[]
  const ids = cars.map((c) => c.id)

  const privRes = ids.length
    ? await supabase.from('vehicle_private').select('*').in('vehicle_id', ids)
    : { data: [], error: null }
  const ready = !privRes.error
  const priv = new Map(((privRes.data ?? []) as VehiclePrivate[]).map((p) => [p.vehicle_id, p]))

  const cost = (id: string) => {
    const p = priv.get(id)
    const total = (p?.purchase_price ?? 0) + (p?.extra_costs ?? 0)
    return total > 0 ? total : null
  }
  const salePrice = (c: Row) => priv.get(c.id)?.sale_price ?? (c.status === 'sold' ? c.price : null)
  const soldAt = (c: Row) => priv.get(c.id)?.sold_at ?? null

  const sold = cars
    .filter((c) => c.status === 'sold')
    .sort((a, b) => (soldAt(b) ?? '').localeCompare(soldAt(a) ?? ''))
  const stock = cars.filter((c) => c.status !== 'sold')

  const invested = stock.reduce((s, c) => s + (cost(c.id) ?? 0), 0)
  const listValue = stock.reduce((s, c) => s + (c.status === 'published' || c.status === 'reserved' ? c.price ?? 0 : 0), 0)
  const revenue = sold.reduce((s, c) => s + (salePrice(c) ?? 0), 0)
  const realized = sold.reduce((s, c) => {
    const k = cost(c.id)
    const p = salePrice(c)
    return k !== null && p !== null ? s + (p - k) : s
  }, 0)
  const tone = (n: number | null) => (n === null ? undefined : n >= 0 ? 'var(--color-teal)' : '#dc2626')

  return (
    <div className="p-4 md:p-8 max-w-6xl flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] md:text-[28px] font-[600] tracking-tight m-0">Ventas y ganancias</h1>
        <p className="text-[13px] text-text-muted mt-1 m-0">
          Solo tú y la administración ven estos números. Se llenan con los costos y ventas que registras en cada auto.
        </p>
      </div>

      <section
        className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-[6px] overflow-hidden"
        style={{ border: '0.5px solid var(--gray-line)', background: 'var(--gray-line)' }}
      >
        {[
          { label: 'Invertido en inventario', value: invested ? fmtPrice(invested) : '—', sub: 'Compra + gastos de lo que no has vendido' },
          { label: 'Valor publicado', value: listValue ? fmtPrice(listValue) : '—', sub: 'Suma de precios en el catálogo' },
          { label: 'Vendidos', value: String(sold.length), sub: revenue ? `${fmtPrice(revenue)} en ventas` : 'Aún sin ventas registradas' },
          { label: 'Ganancia realizada', value: realized ? fmtPrice(realized) : '—', sub: 'Ventas con costos registrados', color: tone(realized || null) },
        ].map((s) => (
          <div key={s.label} className="bg-white px-4 md:px-5 py-4 flex flex-col gap-1 min-w-0">
            <span className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500]">{s.label}</span>
            <span className="text-[22px] font-[600] tracking-tight tabular-nums" style={{ color: s.color }}>{s.value}</span>
            <span className="text-[11.5px] text-text-muted">{s.sub}</span>
          </div>
        ))}
      </section>

      {!ready && (
        <p className="text-[12.5px] text-text-muted m-0">
          Las finanzas se activan cuando la administración corra la migración 006 en Supabase.
        </p>
      )}

      {/* Sold */}
      <Table
        title="Vendidos"
        empty="Cuando vendas un auto, ábrelo y usa «Registrar venta»: aquí verás el precio final y tu ganancia."
        head={['Auto', 'Fecha', 'Precio de venta', 'Inversión', 'Ganancia']}
        rows={sold.map((c) => {
          const k = cost(c.id)
          const p = salePrice(c)
          const profit = k !== null && p !== null ? p - k : null
          const at = soldAt(c)
          return {
            id: c.id,
            title: c.title,
            sub: c.year ? String(c.year) : '',
            cells: [
              at ? format(new Date(at), "d MMM yyyy", { locale: es }) : '—',
              p ? fmtPrice(p) : '—',
              k !== null ? fmtPrice(k) : '—',
              <span key="g" style={{ color: tone(profit) }} className="font-[500]">{profit !== null ? fmtPrice(profit) : '—'}</span>,
            ],
          }
        })}
      />

      {/* In stock */}
      <Table
        title="En inventario"
        empty="No tienes autos sin vender."
        head={['Auto', 'Estado', 'Precio publicado', 'Inversión', 'Ganancia estimada']}
        rows={stock.map((c) => {
          const k = cost(c.id)
          const est = k !== null && c.price ? c.price - k : null
          return {
            id: c.id,
            title: c.title,
            sub: c.year ? String(c.year) : '',
            cells: [
              <StatusPill key="s" status={c.status} />,
              c.price ? fmtPrice(c.price) : '—',
              k !== null ? fmtPrice(k) : <span key="k" className="text-orange">Registrar costo</span>,
              <span key="g" style={{ color: tone(est) }}>{est !== null ? fmtPrice(est) : '—'}</span>,
            ],
          }
        })}
      />
    </div>
  )
}

function Table({
  title, head, rows, empty,
}: {
  title: string
  head: string[]
  rows: { id: string; title: string; sub: string; cells: React.ReactNode[] }[]
  empty: string
}) {
  const cols = '1.6fr 1fr 1fr 1fr 1fr 28px'
  return (
    <section className="bg-white rounded-[6px] overflow-hidden" style={{ border: '0.5px solid var(--gray-line)' }}>
      <header className="px-4 md:px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: '0.5px solid var(--gray-line)' }}>
        <h2 className="text-[14px] font-[600] m-0">{title}</h2>
        <span className="text-[12px] text-text-muted tabular-nums">{rows.length}</span>
      </header>
      {rows.length === 0 ? (
        <p className="px-5 py-8 text-center text-[13.5px] text-text-muted m-0">{empty}</p>
      ) : (
        <>
          <div
            className="hidden md:grid gap-4 px-5 py-2.5 text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500]"
            style={{ gridTemplateColumns: cols, background: 'var(--color-surface-alt)' }}
          >
            {head.map((h) => <span key={h}>{h}</span>)}
            <span />
          </div>
          {rows.map((r, i) => (
            <Link
              key={r.id}
              href={`/vendedor/inventario/${r.id}/editar`}
              className="grid grid-cols-2 md:[grid-template-columns:var(--cols)] gap-x-4 gap-y-2 items-center px-4 md:px-5 py-3.5 text-[13px] tabular-nums hover:bg-surface transition-colors"
              style={{ ['--cols' as string]: cols, borderTop: i ? '0.5px solid var(--gray-line)' : undefined }}
            >
              <span className="col-span-2 md:col-span-1 min-w-0">
                <span className="block text-[14px] font-[500] truncate">{r.title}</span>
                {r.sub && <span className="block text-[12px] text-text-muted">{r.sub}</span>}
              </span>
              {r.cells.map((cell, j) => (
                <span key={j} className="min-w-0">
                  <span className="md:hidden block text-[10px] uppercase tracking-[0.08em] text-text-muted">{head[j + 1]}</span>
                  {cell}
                </span>
              ))}
              <ArrowUpRight size={14} className="hidden md:block text-text-muted justify-self-end" />
            </Link>
          ))}
        </>
      )}
    </section>
  )
}
