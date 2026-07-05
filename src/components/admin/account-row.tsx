'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSellerAccount, deleteSellerAccount } from '@/app/admin/actions'
import type { Seller } from '@/lib/supabase/database.types'

const inputClass = 'w-full px-3 py-2.5 rounded-lg text-[14px] outline-none'
const inputStyle = { border: '0.5px solid var(--gray-line-strong)' }

export function AccountRow({ seller, isFirst }: { seller: Seller; isFirst: boolean }) {
  const [open, setOpen] = useState(false)
  const hasAccount = !!seller.auth_user_id

  return (
    <>
      <div
        className="grid items-center px-5 py-4 gap-4"
        style={{ gridTemplateColumns: '1fr 140px 160px', borderTop: isFirst ? 'none' : '0.5px solid var(--gray-line)' }}
      >
        <div>
          <div className="text-[14px] font-[500]">{seller.name}</div>
          {seller.business_name && <div className="text-[12px] text-text-muted">{seller.business_name}</div>}
        </div>

        <div>
          {hasAccount ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-[11px] font-[500]" style={{ background: '#d0e8ee', color: 'var(--color-teal)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              Con acceso
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-[11px] font-[500]" style={{ background: 'var(--color-surface-alt)', color: 'var(--text-muted)' }}>
              Sin cuenta
            </span>
          )}
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center h-8 px-3.5 rounded-pill text-[12px] font-[500] transition-colors"
            style={hasAccount
              ? { border: '0.5px solid var(--gray-line-strong)' }
              : { background: 'var(--color-orange)', color: '#fff' }}
          >
            {hasAccount ? 'Gestionar' : 'Crear cuenta'}
          </button>
        </div>
      </div>

      {open && <AccountModal seller={seller} onClose={() => setOpen(false)} />}
    </>
  )
}

function AccountModal({ seller, onClose }: { seller: Seller; onClose: () => void }) {
  const router = useRouter()
  const hasAccount = !!seller.auth_user_id
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(''); setMsg('')
    const res = await createSellerAccount(seller.id, email, password)
    setSaving(false)
    if ('error' in res) { setError(res.error ?? ''); return }
    setMsg('Cuenta creada. El vendedor ya puede iniciar sesión en /login.')
  }

  async function handleDelete() {
    if (!seller.auth_user_id) return
    setSaving(true); setError(''); setMsg('')
    const res = await deleteSellerAccount(seller.auth_user_id, seller.id)
    setSaving(false)
    if ('error' in res) { setError(res.error ?? ''); return }
    setMsg('Acceso revocado.')
    setConfirmDelete(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.3)' }}>
      <div className="bg-white rounded-[16px] p-6 w-full max-w-sm flex flex-col gap-4" style={{ border: '0.5px solid var(--gray-line)' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-[600]">{seller.name}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-base">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {hasAccount && !msg ? (
          <>
            <p className="text-[13px] text-text-muted">
              Este vendedor ya tiene acceso a su portal en <strong>/vendedor</strong>.
            </p>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="self-start h-9 px-4 rounded-pill text-[13px] font-[500] text-red-600 transition-colors"
                style={{ border: '0.5px solid #fecaca' }}
              >
                Revocar acceso
              </button>
            ) : (
              <div className="rounded-[14px] p-4 flex flex-col gap-3" style={{ background: '#fef2f2', border: '0.5px solid #fecaca' }}>
                <p className="text-[13px] text-red-700">¿Confirmas? El vendedor perderá acceso.</p>
                <div className="flex gap-2">
                  <button onClick={handleDelete} disabled={saving} className="h-9 px-4 bg-red-600 text-white rounded-pill text-[13px] font-[500] disabled:opacity-60">
                    {saving ? 'Eliminando…' : 'Sí, revocar'}
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="h-9 px-4 rounded-pill text-[13px] font-[500]" style={{ border: '0.5px solid var(--gray-line-strong)' }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </>
        ) : !msg ? (
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500]">Correo</span>
              <input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} style={inputStyle} placeholder="vendedor@ejemplo.com" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500]">Contraseña</span>
              <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} style={inputStyle} placeholder="Mín. 8 caracteres" />
            </label>
            <button type="submit" disabled={saving} className="h-10 bg-orange text-white rounded-pill text-[13px] font-[500] hover:bg-orange-deep transition-colors disabled:opacity-60">
              {saving ? 'Creando…' : 'Crear cuenta'}
            </button>
          </form>
        ) : null}

        {error && <p className="text-[13px] text-red-500">{error}</p>}
        {msg && (
          <div className="flex flex-col gap-3">
            <p className="text-[13px] text-green-700">{msg}</p>
            <button
              onClick={() => { router.refresh(); onClose() }}
              className="self-start h-9 px-4 rounded-pill text-[13px] font-[500]"
              style={{ border: '0.5px solid var(--gray-line-strong)' }}
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
