'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import { Logo } from '@/components/ui/logo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email o contraseña incorrectos')
      setLoading(false)
      return
    }

    // Check if this user is a seller or an admin
    const { data: seller } = await supabase
      .from('sellers')
      .select('id')
      .eq('auth_user_id', authData.user.id)
      .maybeSingle()

    router.push(seller ? '/vendedor/inventario' : '/admin/inventario')
    router.refresh()
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        <div
          className="bg-white rounded-card p-8"
          style={{ border: '0.5px solid var(--gray-line)' }}
        >
          <h1 className="text-[22px] font-[600] tracking-tight mb-6">Acceder</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500]">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="px-3 py-2.5 rounded-chip text-[14px] outline-none transition-colors"
                style={{
                  border: '0.5px solid var(--gray-line-strong)',
                }}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500]">
                Contraseña
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="px-3 py-2.5 rounded-chip text-[14px] outline-none transition-colors"
                style={{
                  border: '0.5px solid var(--gray-line-strong)',
                }}
              />
            </label>

            {error && (
              <p className="text-[13px] text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 h-10 bg-orange text-white rounded-pill font-[500] text-[13px] hover:bg-orange-deep transition-colors disabled:opacity-60 cursor-pointer"
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
