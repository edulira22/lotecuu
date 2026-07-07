'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus } from 'lucide-react'
import { createStandaloneSellerAccount } from '@/app/admin/actions'

const inputClass = 'w-full px-3 py-2.5 rounded-lg text-[14px] outline-none'
const inputStyle = { border: '0.5px solid var(--gray-line-strong)' }

export function NewAccountButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  function close() {
    setOpen(false)
    setEmail(''); setPassword(''); setMsg(''); setError('')
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(''); setMsg('')
    const res = await createStandaloneSellerAccount(email, password)
    setSaving(false)
    if ('error' in res) { setError(res.error ?? ''); return }
    setMsg('Cuenta creada. Compártele el correo y contraseña — al entrar en /login llenará su propio perfil.')
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 h-10 px-5 bg-orange text-white rounded-pill text-[13px] font-[500] hover:bg-orange-deep transition-colors"
      >
        <UserPlus size={14} />
        Nueva cuenta de vendedor
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="bg-white rounded-[16px] p-6 w-full max-w-sm flex flex-col gap-4" style={{ border: '0.5px solid var(--gray-line)' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-[600]">Nueva cuenta de vendedor</h2>
              <button onClick={close} className="text-text-muted hover:text-text-base">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {!msg ? (
              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <p className="text-[13px] text-text-muted">
                  Solo el correo y la contraseña. El vendedor llena su propio nombre, WhatsApp y
                  demás datos al entrar por primera vez.
                </p>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500]">Correo</span>
                  <input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} style={inputStyle} placeholder="vendedor@ejemplo.com" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500]">Contraseña</span>
                  <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} style={inputStyle} placeholder="Mín. 8 caracteres" />
                </label>
                {error && <p className="text-[13px] text-red-500">{error}</p>}
                <button type="submit" disabled={saving} className="h-10 bg-orange text-white rounded-pill text-[13px] font-[500] hover:bg-orange-deep transition-colors disabled:opacity-60">
                  {saving ? 'Creando…' : 'Crear cuenta'}
                </button>
              </form>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-[13px] text-green-700">{msg}</p>
                <button onClick={close} className="self-start h-9 px-4 rounded-pill text-[13px] font-[500]" style={{ border: '0.5px solid var(--gray-line-strong)' }}>
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
