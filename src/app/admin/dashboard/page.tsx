import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PlanEditor } from '@/components/admin/plan-editor'
import type { Seller } from '@/lib/supabase/database.types'

export const metadata = { title: 'Dashboard — LoteCUU Admin' }

const STATUS_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  al_corriente: { bg: '#d1fae5', fg: '#065f46', label: 'Al corriente' },
  atrasado:     { bg: '#fef3c7', fg: '#92400e', label: 'Atrasado' },
  suspendido:   { bg: '#fee2e2', fg: '#991b1b', label: 'Suspendido' },
}
const PLAN_LABEL: Record<string, string> = { basico: 'Básico', pro: 'Pro', premium: 'Premium' }

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: sellersData } = await supabase
    .from('sellers')
    .select('*, vehicles(id, status)')
    .order('created_at', { ascending: false })

  const sellers = (sellersData ?? []) as unknown as (Seller & { vehicles: { id: string; status: string }[] })[]

  const total      = sellers.length
  const corriente  = sellers.filter((s) => s.payment_status === 'al_corriente').length
  const atrasado   = sellers.filter((s) => s.payment_status === 'atrasado').length
  const suspendido = sellers.filter((s) => s.payment_status === 'suspendido').length

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="text-[28px] font-[600] tracking-tight mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total vendedores', value: total,      color: 'var(--color-text-base)' },
          { label: 'Al corriente',     value: corriente,  color: '#065f46' },
          { label: 'Atrasados',        value: atrasado,   color: '#92400e' },
          { label: 'Suspendidos',      value: suspendido, color: '#991b1b' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-[14px] p-5" style={{ border: '0.5px solid var(--gray-line)' }}>
            <div className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500] mb-2">{s.label}</div>
            <div className="text-[32px] font-[600] leading-none" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Sellers table */}
      <div className="bg-white rounded-[14px] overflow-hidden" style={{ border: '0.5px solid var(--gray-line)' }}>
        <div
          className="grid text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500] px-5 py-3"
          style={{ gridTemplateColumns: '1.5fr 80px 80px 80px 140px 1fr 80px', background: 'var(--color-surface-alt)', borderBottom: '0.5px solid var(--gray-line)' }}
        >
          <span>Vendedor</span>
          <span>Plan</span>
          <span>Autos</span>
          <span>Límite</span>
          <span>Pago</span>
          <span>Notas</span>
          <span />
        </div>

        {sellers.length === 0 && (
          <div className="px-5 py-12 text-center text-[14px] text-text-muted">Sin vendedores.</div>
        )}

        {sellers.map((seller, i) => {
          const activeVehicles = seller.vehicles?.filter((v) =>
            ['published', 'reserved', 'hidden', 'draft'].includes(v.status),
          ).length ?? 0
          const st = STATUS_STYLE[seller.payment_status] ?? STATUS_STYLE.al_corriente

          return (
            <div
              key={seller.id}
              className="grid items-center px-5 py-4 gap-3"
              style={{ gridTemplateColumns: '1.5fr 80px 80px 80px 140px 1fr 80px', borderTop: i === 0 ? 'none' : '0.5px solid var(--gray-line)' }}
            >
              <div>
                <div className="text-[14px] font-[500]">{seller.name}</div>
                {seller.business_name && <div className="text-[12px] text-text-muted">{seller.business_name}</div>}
                <div className="flex items-center gap-2 mt-1">
                  {seller.auth_user_id ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded text-teal" style={{ background: '#d0e8ee' }}>Con acceso</span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded text-text-muted" style={{ background: 'var(--color-surface-alt)' }}>Sin cuenta</span>
                  )}
                </div>
              </div>

              <div className="text-[13px] font-[500]">{PLAN_LABEL[seller.plan] ?? seller.plan}</div>

              <div className="text-[13px]">
                <span className={activeVehicles >= seller.max_vehicles ? 'text-red-500 font-[500]' : ''}>{activeVehicles}</span>
              </div>

              <div className="text-[13px] text-text-muted">{seller.max_vehicles}</div>

              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-[11px] font-[500]"
                  style={{ background: st.bg, color: st.fg }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {st.label}
                </span>
              </div>

              <div className="text-[12px] text-text-muted truncate">{seller.payment_notes ?? '—'}</div>

              <div className="flex gap-1 justify-end">
                <PlanEditor seller={seller} />
                <Link
                  href={`/admin/vendedores/${seller.id}/editar`}
                  className="inline-flex items-center gap-1 h-8 px-2.5 rounded-pill text-[12px] font-[500] transition-colors"
                  style={{ border: '0.5px solid var(--gray-line-strong)' }}
                >
                  <Pencil size={11} />
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
