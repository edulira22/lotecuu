import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, Pencil } from 'lucide-react'
import { PlanEditor } from '@/components/admin/plan-editor'
import type { Seller } from '@/lib/supabase/database.types'

export const metadata = { title: 'Vendedores' }

const COLS = '1fr 90px 140px 100px 170px'

export default async function VendedoresAdminPage() {
  const supabase = await createClient()
  const { data: sellersData } = await supabase
    .from('sellers')
    .select('*, vehicles(id, status, featured)')
    .order('created_at', { ascending: false })

  const sellers = (sellersData ?? []) as unknown as (Seller & { vehicles: { id: string; status: string; featured: boolean }[] })[]

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-[22px] md:text-[28px] font-[600] tracking-tight">Vendedores</h1>
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

      <div className="bg-white rounded-[6px] overflow-hidden" style={{ border: '0.5px solid var(--gray-line)' }}>
        {/* Header */}
        <div
          className="hidden md:grid [grid-template-columns:var(--cols)] text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500] px-5 py-3"
          style={{
            ['--cols' as string]: COLS,
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
            className="grid grid-cols-2 gap-x-4 gap-y-3 md:gap-4 md:items-center md:[grid-template-columns:var(--cols)] px-4 md:px-5 py-4"
            style={{
              ['--cols' as string]: COLS,
              borderTop: i === 0 ? 'none' : '0.5px solid var(--gray-line)',
            }}
          >
            <div className="col-span-2 md:col-span-1 min-w-0">
              <div className="text-[14px] font-[500]">{seller.name}</div>
              {seller.business_name && (
                <div className="text-[12px] text-text-muted">{seller.business_name}</div>
              )}
              <div className="text-[12px] text-text-muted font-mono mt-0.5">/{seller.slug}</div>
            </div>
            <div className="text-[13px]">
              <span className="md:hidden block text-[10.5px] uppercase tracking-[0.08em] text-text-muted mb-0.5">Autos</span>
              <span className={atLimit ? 'text-red-500 font-[500]' : 'text-text-base'}>{activeCount}</span>
              <span className="text-text-muted"> / {seller.max_vehicles}</span>
              <div className="text-[11px] text-text-muted mt-0.5" title="Destacados usados / permitidos">
                ★ {seller.vehicles?.filter((v) => v.featured).length ?? 0}/{seller.max_featured ?? 0}
              </div>
            </div>
            <div className="text-[13px] text-text-muted">
              <span className="md:hidden block text-[10.5px] uppercase tracking-[0.08em] mb-0.5">WhatsApp</span>
              {seller.whatsapp || '—'}
            </div>
            <div className="col-span-2 md:col-span-1">
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
            <div className="col-span-2 md:col-span-1 flex md:justify-end gap-1.5">
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
