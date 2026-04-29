import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Plus, Pencil } from 'lucide-react'
import { fmtPrice } from '@/lib/format'
import { StatusPill } from '@/components/ui/status-pill'
import { CarPlaceholder, getPlaceholderTone } from '@/components/ui/car-placeholder'
import type { VehicleStatus } from '@/lib/supabase/database.types'

export const metadata = { title: 'Inventario' }

const STATUS_LABEL: Record<string, string> = {
  published: 'Publicado',
  draft: 'Borrador',
  hidden: 'Oculto',
  reserved: 'Apartado',
  sold: 'Vendido',
}

export default async function InventarioPage() {
  const supabase = await createClient()
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select(`
      id, title, status, year, price, featured, slug,
      seller:sellers(name),
      cover_photo:vehicle_photos(url, is_cover)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-[28px] font-[600] tracking-tight">Inventario</h1>
          <p className="text-[13px] text-text-muted mt-1">
            {vehicles?.length ?? 0} vehículos
          </p>
        </div>
        <Link
          href="/admin/inventario/nuevo"
          className="inline-flex items-center gap-2 h-10 px-5 bg-orange text-white rounded-pill text-[13px] font-[500] hover:bg-orange-deep transition-colors"
        >
          <Plus size={14} />
          Publicar auto
        </Link>
      </div>

      <div className="bg-white rounded-[14px] overflow-hidden" style={{ border: '0.5px solid var(--gray-line)' }}>
        {/* Header */}
        <div
          className="hidden md:grid text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500] px-5 py-3"
          style={{
            gridTemplateColumns: '64px 1.8fr 1fr 100px 130px 90px',
            gap: '14px',
            background: 'var(--color-surface-alt)',
            borderBottom: '0.5px solid var(--gray-line)',
          }}
        >
          <span />
          <span>Auto</span>
          <span>Estado</span>
          <span>Año</span>
          <span className="text-right">Precio</span>
          <span />
        </div>

        {vehicles?.length === 0 && (
          <div className="px-5 py-12 text-center text-[14px] text-text-muted">
            Aún no hay vehículos. Crea el primero.
          </div>
        )}

        {vehicles?.map((v, i) => {
          const cover = (v.cover_photo as { url: string; is_cover: boolean }[] | null)
            ?.find((p) => p.is_cover) ?? (v.cover_photo as { url: string }[] | null)?.[0]

          return (
            <div
              key={v.id}
              className="grid md:grid items-center px-5 py-3 gap-4"
              style={{
                gridTemplateColumns: '64px 1.8fr 1fr 100px 130px 90px',
                borderTop: i === 0 ? 'none' : '0.5px solid var(--gray-line)',
              }}
            >
              {/* Thumbnail */}
              <div className="w-16 h-11 rounded-[6px] overflow-hidden bg-surface-alt shrink-0">
                {cover ? (
                  <Image
                    src={cover.url}
                    alt={v.title}
                    width={64}
                    height={44}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <CarPlaceholder seed={v.id} className="w-full h-full" />
                )}
              </div>

              {/* Title */}
              <div className="min-w-0">
                <div className="text-[14px] font-[500] truncate">{v.title}</div>
                <div className="text-[12px] text-text-muted truncate">
                  {(v.seller as unknown as { name: string } | null)?.name}
                  {v.featured && (
                    <span className="ml-2 text-orange font-[500]">★ Destacado</span>
                  )}
                </div>
              </div>

              {/* Status */}
              <div>
                <StatusPill status={v.status as VehicleStatus} />
              </div>

              {/* Year */}
              <div className="text-[13px] text-text-muted">{v.year ?? '—'}</div>

              {/* Price */}
              <div className="text-[14px] font-[500] text-right">
                {v.price ? (
                  fmtPrice(v.price)
                ) : (
                  <span className="text-text-muted font-[400]">—</span>
                )}
              </div>

              {/* Edit */}
              <div className="flex justify-end">
                <Link
                  href={`/admin/inventario/${v.id}/editar`}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-pill text-[12px] font-[500] transition-colors hover:bg-surface-alt"
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
