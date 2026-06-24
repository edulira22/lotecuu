'use client'

import { useState } from 'react'
import { createSellerAccount, deleteSellerAccount } from '@/app/admin/actions'
import type { Seller } from '@/lib/supabase/database.types'

const inputClass = 'w-full px-3 py-2.5 rounded-lg text-[14px] outline-none'
const inputStyle = { border: '0.5px solid var(--gray-line-strong)' }

export function AccountManager({ seller }: { seller: Seller }) {
  const hasAccount = !!seller.auth_user_id
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(''); setMsg('')
    const res = await createSellerAccount(seller.id, email, password)
    setSaving(false)
    if ('error' in res) { setError(res.error ?? ''); return }
    setMsg('Cuenta creada correctamente. El vendedor ya puede iniciar sesión.')
  }

  async function handleDelete() {
    if (!seller.auth_user_id) return
    setSaving(true); setError(''); setMsg('')
    const res = await deleteSellerAccount(seller.auth_user_id, seller.id)
    setSaving(false)
    if ('error' in res) { setError(res.error ?? ''); return }
    setMsg('Cuenta eliminada. El vendedor ya no tiene acceso.')
    setConfirmDelete(false)
  }

  if (hasAccount) {
    return (
      <div className="flex flex-col gap-5">
        <div className="rounded-[14px] p-5 flex flex-col gap-3" style={{ background: '#f0fdf4', border: '0.5px solid #bbf7d0' }}>
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span className="text-[14px] font-[500] text-green-800">Este vendedor tiene acceso activo</span>
          </div>
          <p className="text-[13px] text-green-700">
            Puede iniciar sesión en <strong>/login</strong> con sus credenciales y gestionar su inventario.
          </p>
        </div>

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
            <p className="text-[13px] text-red-700">¿Confirmas eliminar la cuenta? El vendedor perderá acceso al portal.</p>
            <div className="flex gap-2">
              <button onClick={handleDelete} disabled={saving}
                className="h-9 px-4 bg-red-600 text-white rounded-pill text-[13px] font-[500] hover:bg-red-700 transition-colors disabled:opacity-60">
                {saving ? 'Eliminando…' : 'Sí, revocar acceso'}
              </button>
              <button onClick={() => setConfirmDelete(false)}
                className="h-9 px-4 rounded-pill text-[13px] font-[500]" style={{ border: '0.5px solid var(--gray-line-strong)' }}>
                Cancelar
              </button>
            </div>
          </div>
        )}
        {(msg || error) && <p className={`text-[13px] ${error ? 'text-red-500' : 'text-green-700'}`}>{msg || error}</p>}
      </div>
    )
  }

  return (
    <form onSubmit={handleCreate} className="flex flex-col gap-4">
      <div className="rounded-[14px] p-4 text-[13px]" style={{ background: 'var(--color-surface-alt)', border: '0.5px solid var(--gray-line)' }}>
        Este vendedor aún no tiene cuenta. Crea sus credenciales de acceso abajo.
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500]">Email de acceso</span>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} style={inputStyle} placeholder="vendedor@ejemplo.com" />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500]">Contraseña inicial</span>
        <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} style={inputStyle} placeholder="Mín. 8 caracteres" />
        <span className="text-[11px] text-text-muted">El vendedor podrá cambiarla después desde su perfil.</span>
      </label>

      {(msg || error) && <p className={`text-[13px] ${error ? 'text-red-500' : 'text-green-700'}`}>{msg || error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="self-start h-10 px-6 bg-orange text-white rounded-pill text-[13px] font-[500] hover:bg-orange-deep transition-colors disabled:opacity-60"
      >
        {saving ? 'Creando cuenta…' : 'Crear cuenta de acceso'}
      </button>
    </form>
  )
}
