import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { StatusPill } from '@/components/ui/status-pill'
import { fmtPrice, fmtKm } from '@/lib/format'
import type { Seller } from '@/lib/supabase/database.types'

export const metadata = { title: 'Mis autos — LoteCUU' }

export default async function VendorInventarioPage() {
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

  const all = vehicles ?? []
  const activeCount = all.filter((v) => ['published', 'reserved', 'hidden', 'draft'].includes(v.status)).length
  const atLimit = activeCount >= seller.max_vehicles
  const profileIncomplete = !seller.whatsapp

  return (
    <div className="p-8 max-w-5xl">
      {profileIncomplete && (
        <div
          className="mb-6 px-4 py-3.5 rounded-xl text-[13px] flex items-center justify-between gap-3 flex-wrap"
          style={{ background: '#fff8f0', border: '0.5px solid #fde4c4', color: '#92400e' }}
        >
          <span>Completa tu perfil (nombre y WhatsApp) antes de publicar un auto — es lo que verán los compradores.</span>
          <Link
            href="/vendedor/perfil"
            className="shrink-0 inline-flex items-center h-8 px-4 rounded-pill text-[12px] font-[500] bg-orange text-white hover:bg-orange-deep transition-colors"
          >
            Completar perfil
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-[28px] font-[600] tracking-tight">Mis autos</h1>
          {/* Plan usage bar */}
          <div className="flex items-center gap-3 mt-2">
            <div className="w-40 h-1.5 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min((activeCount / seller.max_vehicles) * 100, 100)}%`,
                  background: atLimit ? '#ef4444' : '#FB9833',
                }}
              />
            </div>
            <span className="text-[12px] text-text-muted">
              <strong className={atLimit ? 'text-red-500' : 'text-text-base'}>{activeCount}</strong>
              {' / '}{seller.max_vehicles} autos en tu plan
            </span>
          </div>
        </div>
        {atLimit ? (
          <div className="inline-flex items-center gap-2 h-10 px-5 rounded-pill text-[13px] font-[500] bg-gray-100 text-text-muted cursor-not-allowed">
            Límite alcanzado
          </div>
        ) : (
          <Link
            href="/vendedor/inventario/nuevo"
            className="inline-flex items-center gap-2 h-10 px-5 bg-orange text-white rounded-pill text-[13px] font-[500] hover:bg-orange-deep transition-colors"
          >
            <Plus size={14} />
            Agregar auto
          </Link>
        )}
      </div>

      {atLimit && (
        <div className="mb-5 px-4 py-3 rounded-xl text-[13px]" style={{ background: '#fef2f2', border: '0.5px solid #fecaca', color: '#991b1b' }}>
          Has alcanzado el límite de tu plan ({seller.max_vehicles} autos). Contacta al administrador para ampliar tu plan.
        </div>
      )}

      <div className="bg-white rounded-[14px] overflow-hidden" style={{ border: '0.5px solid var(--gray-line)' }}>
        <div
          className="grid text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500] px-5 py-3"
          style={{ gridTemplateColumns: '1fr 120px 100px 80px', background: 'var(--color-surface-alt)', borderBottom: '0.5px solid var(--gray-line)' }}
        >
          <span>Vehículo</span><span>Estado</span><span>Precio</span><span />
        </div>

        {all.length === 0 && (
          <div className="px-5 py-12 text-center text-[14px] text-text-muted">
            Aún no tienes autos registrados.
          </div>
        )}

        {all.map((v, i) => (
          <div
            key={v.id}
            className="grid items-center px-5 py-4 gap-4"
            style={{ gridTemplateColumns: '1fr 120px 100px 80px', borderTop: i === 0 ? 'none' : '0.5px solid var(--gray-line)' }}
          >
            <div>
              <div className="text-[14px] font-[500]">{v.title}</div>
              <div className="text-[12px] text-text-muted mt-0.5">
                {[v.year, v.mileage ? fmtKm(v.mileage) : null].filter(Boolean).join(' · ')}
              </div>
            </div>
            <StatusPill status={v.status} />
            <div className="text-[13px] font-[500]">
              {v.price ? fmtPrice(v.price) : <span className="text-text-muted">—</span>}
            </div>
            <div className="flex justify-end">
              <Link
                href={`/vendedor/inventario/${v.id}/editar`}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-pill text-[12px] font-[500] transition-colors"
                style={{ border: '0.5px solid var(--gray-line-strong)' }}
              >
                <Pencil size={12} />
                Editar
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
