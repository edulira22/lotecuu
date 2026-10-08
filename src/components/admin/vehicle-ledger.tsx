'use client'

import { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/browser'
import { fmtPrice } from '@/lib/format'
import type { VehicleStatus } from '@/lib/supabase/database.types'

const inputClass = 'w-full px-3 py-2.5 rounded-[4px] text-[14px] outline-none bg-white'
const inputStyle = { border: '0.5px solid var(--gray-line-strong)' }

const toDisplay = (n: number | null | undefined) => (n ? '$' + n.toLocaleString('es-MX') : '')
const toNumber = (s: string) => {
  const raw = s.replace(/\D/g, '')
  return raw ? parseInt(raw, 10) : null
}

function MoneyInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={(e) => {
        const n = toNumber(e.target.value)
        onChange(n === null ? '' : toDisplay(n))
      }}
      placeholder={placeholder}
      className={inputClass}
      style={inputStyle}
    />
  )
}

/**
 * Private numbers for one car: what it cost, what was spent on it and what it
 * sold for. Lives in `vehicle_private` (owner + admin only, never public).
 */
export function VehicleLedger({
  vehicleId,
  listPrice,
  status,
}: {
  vehicleId: string
  listPrice: number | null
  status: VehicleStatus
}) {
  const [state, setState] = useState<'loading' | 'ready' | 'unavailable'>('loading')
  const [purchase, setPurchase] = useState('')
  const [extra, setExtra] = useState('')
  const [sale, setSale] = useState('')
  const [soldAt, setSoldAt] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('vehicle_private')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .maybeSingle()
      .then(({ data, error: e }) => {
        if (e) { setState('unavailable'); return }
        if (data) {
          setPurchase(toDisplay(data.purchase_price))
          setExtra(toDisplay(data.extra_costs))
          setSale(toDisplay(data.sale_price))
          setSoldAt(data.sold_at ?? '')
          setNotes(data.notes ?? '')
        }
        setState('ready')
      })
  }, [vehicleId])

  const invest = (toNumber(purchase) ?? 0) + (toNumber(extra) ?? 0)
  const isSold = status === 'sold'
  const reference = toNumber(sale) ?? (isSold ? null : listPrice)
  const profit = invest > 0 && reference ? reference - invest : null
  const margin = profit !== null && invest > 0 ? Math.round((profit / invest) * 100) : null

  async function save(extraPatch?: { markSold?: boolean }) {
    setSaving(true); setError(''); setMsg('')
    const supabase = createClient()
    const today = new Date().toISOString().slice(0, 10)
    const salePrice = toNumber(sale) ?? (extraPatch?.markSold ? listPrice : null)
    const { error: e } = await supabase.from('vehicle_private').upsert({
      vehicle_id: vehicleId,
      purchase_price: toNumber(purchase),
      extra_costs: toNumber(extra),
      sale_price: salePrice,
      sold_at: soldAt || (extraPatch?.markSold ? today : null),
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    if (e) { setError(e.message); setSaving(false); return }
    if (extraPatch?.markSold) {
      const { error: e2 } = await supabase.from('vehicles').update({ status: 'sold', featured: false }).eq('id', vehicleId)
      if (e2) { setError(e2.message); setSaving(false); return }
      // Full reload so the vehicle form above also picks up the new "Vendido"
      // status (otherwise saving that form would publish the car again)
      window.location.reload()
      return
    }
    setSaving(false)
    setMsg(extraPatch?.markSold ? '¡Venta registrada! El auto ya aparece como vendido.' : 'Guardado.')
  }

  return (
    <section className="bg-white rounded-[6px] p-4 sm:p-6 flex flex-col gap-5" style={{ border: '0.5px solid var(--gray-line)' }}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[16px] font-[600] m-0">Finanzas del auto</h2>
          <p className="text-[12px] text-text-muted m-0 mt-1 inline-flex items-center gap-1.5">
            <Lock size={12} /> Privado: solo tú y la administración lo ven. Nunca aparece en el sitio.
          </p>
        </div>
        {isSold && (
          <span className="px-2.5 py-1 rounded-[4px] text-[11px] font-[500] uppercase tracking-[0.06em]" style={{ background: 'var(--color-status-gray-bg)', color: 'var(--color-status-gray-fg)' }}>
            Vendido{soldAt ? ` · ${new Date(soldAt + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
          </span>
        )}
      </div>

      {state === 'loading' && <p className="text-[13px] text-text-muted m-0">Cargando…</p>}
      {state === 'unavailable' && (
        <p className="text-[13px] text-text-muted m-0">
          Esta herramienta se activa cuando la administración corra la migración 006 en Supabase.
        </p>
      )}

      {state === 'ready' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500]">Precio de compra</span>
              <MoneyInput value={purchase} onChange={setPurchase} placeholder="$150,000" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500]">Gastos (reparación, trámites…)</span>
              <MoneyInput value={extra} onChange={setExtra} placeholder="$12,000" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500]">Precio final de venta</span>
              <MoneyInput value={sale} onChange={setSale} placeholder={listPrice ? toDisplay(listPrice) : '$195,000'} />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500]">Fecha de venta</span>
              <input type="date" value={soldAt} onChange={(e) => setSoldAt(e.target.value)} className={inputClass} style={inputStyle} />
            </label>
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500]">Notas privadas</span>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej. Se lo compré a Juan Pérez, pendiente cambio de propietario" className={inputClass} style={inputStyle} />
            </label>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px rounded-[4px] overflow-hidden" style={{ border: '0.5px solid var(--gray-line)', background: 'var(--gray-line)' }}>
            {[
              { label: 'Inversión total', value: invest > 0 ? fmtPrice(invest) : '—' },
              { label: isSold || toNumber(sale) ? 'Precio de venta' : 'Precio publicado', value: reference ? fmtPrice(reference) : '—' },
              {
                label: isSold || toNumber(sale) ? 'Ganancia' : 'Ganancia estimada',
                value: profit !== null ? `${fmtPrice(profit)}${margin !== null ? ` (${margin}%)` : ''}` : '—',
                tone: profit === null ? undefined : profit >= 0 ? 'var(--color-teal)' : '#dc2626',
              },
            ].map((s, i) => (
              <div key={s.label} className="px-4 py-3 flex flex-col gap-1" style={{ background: 'var(--color-surface)' }}>
                <span className="text-[10.5px] text-text-muted uppercase tracking-[0.08em] font-[500]">{s.label}</span>
                <span className="text-[16px] font-[500] tabular-nums" style={{ color: s.tone }}>{s.value}</span>
              </div>
            ))}
          </div>

          {error && <p className="text-[13px] text-red-500 m-0">{error}</p>}
          {msg && <p className="text-[13px] text-green-700 m-0">{msg}</p>}

          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => save()}
              disabled={saving}
              className="h-10 px-5 rounded-[4px] text-[13px] font-[500] bg-dark text-white hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Guardar finanzas'}
            </button>
            {!isSold && (
              <button
                type="button"
                onClick={() => save({ markSold: true })}
                disabled={saving}
                className="h-10 px-5 rounded-[4px] text-[13px] font-[500] text-white bg-orange hover:bg-orange-deep transition-colors disabled:opacity-60"
              >
                Registrar venta
              </button>
            )}
          </div>
        </>
      )}
    </section>
  )
}
