import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/ui/navbar'
import { Hero } from '@/components/feed/hero'
import { FilterBar } from '@/components/feed/filter-bar'
import { CarCard } from '@/components/feed/car-card'
import type { FeedVehicle } from '@/components/feed/car-card'
import type { VehicleStatus } from '@/lib/supabase/database.types'

export const metadata = { title: 'Autos usados en Chihuahua — LoteCUU' }

type SearchParams = { f?: string; q?: string }

function applyFilter(vehicles: FeedVehicle[], f: string, q: string): FeedVehicle[] {
  let result = vehicles

  if (q) {
    const lower = q.toLowerCase()
    result = result.filter(
      (v) =>
        v.title.toLowerCase().includes(lower) ||
        (v.version ?? '').toLowerCase().includes(lower),
    )
  }

  switch (f) {
    case 'sedan':     return result.filter((v) => v.body_type?.toLowerCase() === 'sedán')
    case 'suv':       return result.filter((v) => v.body_type?.toLowerCase() === 'suv')
    case 'pickup':    return result.filter((v) => v.body_type?.toLowerCase() === 'pickup')
    case 'camioneta': return result.filter((v) => v.body_type?.toLowerCase() === 'camioneta')
    case 'auto':      return result.filter((v) => v.transmission?.toLowerCase().includes('autom'))
    case 'manual':    return result.filter((v) => v.transmission?.toLowerCase() === 'manual')
    case 'featured':  return result.filter((v) => v.featured)
    case 'budget':    return result.filter((v) => v.price !== null && v.price <= 200000)
    case '2020plus':  return result.filter((v) => v.year !== null && v.year >= 2020)
    default:          return result
  }
}

export default async function AutosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { f = 'all', q = '' } = await searchParams
  const supabase = await createClient()

  const { data: raw } = await supabase
    .from('vehicles')
    .select(`
      id, title, version, status, year, price, mileage, transmission, body_type, featured, slug,
      seller:sellers(id, name, whatsapp),
      photos:vehicle_photos(url, is_cover, sort_order)
    `)
    .in('status', ['published', 'reserved', 'sold'])
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })

  const vehicles = (raw ?? []) as unknown as FeedVehicle[]
  const filtered = applyFilter(vehicles, f, q)
  const availableCount = vehicles.filter((v) => v.status !== 'sold').length

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <Hero count={availableCount} />

      <Suspense>
        <FilterBar active={f} />
      </Suspense>

      {/* Sort bar */}
      <div className="flex items-center justify-between px-5 md:px-10 py-4 md:py-5 text-[13px]">
        <span className="text-text-muted">
          <strong className="text-text-base font-[500]">{filtered.length}</strong> autos
        </span>
        <span className="text-text-base font-[500]">Más recientes</span>
      </div>

      {/* Grid */}
      <div className="px-5 md:px-10 pb-16">
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-text-muted text-[14px]">
            Sin resultados para este filtro.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filtered.map((v) => (
              <CarCard
                key={v.id}
                vehicle={v}
                wide={v.featured && filtered.indexOf(v) === 0}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="px-5 md:px-10 py-8 md:py-12 mt-8" style={{ background: '#1E232B', color: 'rgba(255,255,255,0.7)' }}>
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div>
            <div className="mb-3">
              <span className="text-[20px] font-[600] text-white tracking-tight">LoteCUU</span>
            </div>
            <p className="text-[13px] leading-relaxed max-w-[320px]">
              La vitrina digital de autos usados de Chihuahua. Hecho local, con cariño.
            </p>
          </div>
          <div className="flex gap-12 text-[13px]">
            <div className="flex flex-col gap-2">
              <div className="text-white font-[500] mb-1">Plataforma</div>
              <a href="/autos" className="hover:text-white transition-colors">Autos</a>
              <a href="/vendedores" className="hover:text-white transition-colors">Vendedores</a>
              <a href="/publicar" className="hover:text-white transition-colors">Publicar</a>
            </div>
          </div>
        </div>
        <div
          className="mt-8 pt-5 text-[12px] opacity-60"
          style={{ borderTop: '0.5px solid rgba(255,255,255,0.1)' }}
        >
          © 2026 LoteCUU · Chihuahua, México
        </div>
      </footer>
    </div>
  )
}
