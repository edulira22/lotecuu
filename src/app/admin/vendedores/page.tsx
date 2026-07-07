import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, Pencil } from 'lucide-react'
import { PlanEditor } from '@/components/admin/plan-editor'
import type { Seller } from '@/lib/supabase/database.types'

export const metadata = { title: 'Vendedores' }

export default async function VendedoresAdminPage() {
  const supabase = await createClient()
  const { data: sellersData } = await supabase
    .from('sellers')
    .select('*, vehicles(id, status)')
    .order('created_at', { ascending: false })

  const sellers = (sellersData ?? []) as unknown as (Seller & { vehicles: { id: string; status: string }[] })[]

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-[28px] font-[600] tracking-tight">Vendedores</h1>
          <p className="text-[13px] text-text-muted mt-1">
            {sellers?.length ?? 0} registrados
          </p>
        </div>
        <Link
          href="/admin/vendedores/nuevo"
          className="inline-flex items-center gap-2 h-10 px-5 bg-orange text-white rounded-pill text-[13px] font-[500] hover:bg-orange-deep transition-colors"
        >
          <Plus size={14} />
          Nuevo vendedor
        </Link>
      </div>

      <div className="bg-white rounded-[14px] overflow-hidden" style={{ border: '0.5px solid var(--gray-line)' }}>
        {/* Header */}
        <div
          className="grid text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500] px-5 py-3"
          style={{
            gridTemplateColumns: '1fr 90px 140px 100px 170px',
            background: 'var(--color-surface-alt)',
            borderBottom: '0.5px solid var(--gray-line)',
          }}
        >
          <span>Nombre</span>
          <span>Autos</span>
          <span>WhatsApp</span>
          <span>Estado</span>
          <span />
        </div>

        {sellers?.length === 0 && (
          <div className="px-5 py-12 text-center text-[14px] text-text-muted">
            Aún no hay vendedores registrados.
          </div>
        )}

        {sellers?.map((seller, i: number) => {
          const activeCount = seller.vehicles?.filter((v) =>
            ['published', 'reserved', 'hidden', 'draft'].includes(v.status),
          ).length ?? 0
          const atLimit = activeCount >= seller.max_vehicles

          return (
          <div
            key={seller.id}
            className="grid items-center px-5 py-4 gap-4"
            style={{
              gridTemplateColumns: '1fr 90px 140px 100px 170px',
              borderTop: i === 0 ? 'none' : '0.5px solid var(--gray-line)',
            }}
          >
            <div>
              <div className="text-[14px] font-[500]">{seller.name}</div>
              {seller.business_name && (
                <div className="text-[12px] text-text-muted">{seller.business_name}</div>
              )}
              <div className="text-[12px] text-text-muted font-mono mt-0.5">/{seller.slug}</div>
            </div>
            <div className="text-[13px]">
              <span className={atLimit ? 'text-red-500 font-[500]' : 'text-text-base'}>{activeCount}</span>
              <span className="text-text-muted"> / {seller.max_vehicles}</span>
            </div>
            <div className="text-[13px] text-text-muted">{seller.whatsapp || '—'}</div>
            <div>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-[11px] font-[500]"
                style={{
                  background: seller.active ? 'var(--color-status-green-bg)' : 'var(--color-status-gray-bg)',
                  color: seller.active ? 'var(--color-status-green-fg)' : 'var(--color-status-gray-fg)',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {seller.active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <div className="flex justify-end gap-1.5">
              <PlanEditor seller={seller} />
              <Link
                href={`/admin/vendedores/${seller.id}/editar`}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-pill text-[12px] font-[500] transition-colors"
                style={{ border: '0.5px solid var(--gray-line-strong)' }}
              >
                <Pencil size={12} />
                Editar
              </Link>
            </div>
          </div>
          )
        })}
      </div>
    </div>
  )
}
