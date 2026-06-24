'use client'

import { useState } from 'react'
import { updateSellerPlan } from '@/app/admin/actions'
import type { Seller } from '@/lib/supabase/database.types'

const inputClass = 'w-full px-3 py-2 rounded-lg text-[13px] outline-none'
const inputStyle = { border: '0.5px solid var(--gray-line-strong)' }

export function PlanEditor({ seller }: { seller: Seller }) {
  const [open, setOpen] = useState(false)
  const [plan, setPlan] = useState(seller.plan)
  const [max, setMax] = useState(String(seller.max_vehicles))
  const [status, setStatus] = useState(seller.payment_status)
  const [notes, setNotes] = useState<string>(seller.payment_notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    setSaving(true)
    setError('')
    const res = await updateSellerPlan(seller.id, plan, Number(max), status, notes)
    setSaving(false)
    if ('error' in res) { setError(res.error ?? ''); return }
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center h-8 px-2.5 rounded-pill text-[12px] font-[500] bg-orange text-white hover:bg-orange-deep transition-colors"
      >
        Plan
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="bg-white rounded-[16px] p-6 w-full max-w-sm flex flex-col gap-4" style={{ border: '0.5px solid var(--gray-line)' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-[600]">{seller.name}</h2>
              <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text-base">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500]">Plan</span>
                <select value={plan} onChange={(e) => setPlan(e.target.value as Seller['plan'])} className={inputClass} style={inputStyle}>
                  <option value="basico">Básico</option>
                  <option value="pro">Pro</option>
                  <option value="premium">Premium</option>
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500]">Máx. vehículos</span>
                <input type="number" value={max} onChange={(e) => setMax(e.target.value)} min={1} max={999} className={inputClass} style={inputStyle} />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500]">Estado de pago</span>
                <select value={status} onChange={(e) => setStatus(e.target.value as Seller['payment_status'])} className={inputClass} style={inputStyle}>
                  <option value="al_corriente">Al corriente</option>
                  <option value="atrasado">Atrasado</option>
                  <option value="suspendido">Suspendido</option>
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500]">Notas internas</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Ej. Pagó el 1ro de mayo, vence en junio…"
                  className={inputClass}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </label>
            </div>

            {error && <p className="text-[12px] text-red-500">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 h-9 bg-orange text-white rounded-pill text-[13px] font-[500] hover:bg-orange-deep transition-colors disabled:opacity-60"
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="h-9 px-4 rounded-pill text-[13px] font-[500]"
                style={{ border: '0.5px solid var(--gray-line-strong)' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
