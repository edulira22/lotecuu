import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/ui/navbar'
import { Hero } from '@/components/feed/hero'
import { FilterBar } from '@/components/feed/filter-bar'
import { CarCard } from '@/components/feed/car-card'
import { Logo } from '@/components/ui/logo'
import type { FeedVehicle } from '@/components/feed/car-card'
import type { VehicleStatus } from '@/lib/supabase/database.types'

export const metadata = { title: 'Autos usados en Chihuahua — LoteCUU' }

type SearchParams = {
  // new multi-param filters
  tipo?: string
  trans?: string
  precio?: string
  anio?: string
  dest?: string
  q?: string
  // legacy single-param (kept for back-compat)
  f?: string
}

function applyFilter(
  vehicles: FeedVehicle[],
  { tipo, trans, precio, anio, dest, f, q }: SearchParams,
): FeedVehicle[] {
  let r = vehicles

  // Text search
  if (q) {
    const lo = q.toLowerCase()
    r = r.filter(
      (v) => v.title.toLowerCase().includes(lo) || (v.version ?? '').toLowerCase().includes(lo),
    )
  }

  // Tipo de carrocería
  const tipoVal = tipo ?? f ?? ''
  const TIPO_MAP: Record<string, string[]> = {
    sedan:      ['sedán', 'sedan'],
    suv:        ['suv'],
    pickup:     ['pickup'],
    camioneta:  ['camioneta'],
    hatchback:  ['hatchback'],
    coupe:      ['coupé', 'coupe'],
    convertible: ['convertible'],
  }
  if (tipoVal && TIPO_MAP[tipoVal]) {
    r = r.filter((v) => TIPO_MAP[tipoVal].includes(v.body_type?.toLowerCase() ?? ''))
  }

  // Transmisión
  if (trans === 'auto')   r = r.filter((v) => v.transmission?.toLowerCase().includes('autom'))
  if (trans === 'manual') r = r.filter((v) => v.transmission?.toLowerCase() === 'manual')
  if (trans === 'cvt')    r = r.filter((v) => v.transmission?.toLowerCase() === 'cvt')

  // Presupuesto
  const MAX_PRICE: Record<string, number> = { '150k': 150000, '250k': 250000, '400k': 400000 }
  if (precio && MAX_PRICE[precio]) {
    r = r.filter((v) => v.price !== null && v.price <= MAX_PRICE[precio])
  }
  // legacy budget filter
  if (f === 'budget') r = r.filter((v) => v.price !== null && v.price <= 200000)

  // Año mínimo
  if (anio) {
    const minYear = parseInt(anio, 10)
    if (!isNaN(minYear)) r = r.filter((v) => v.year !== null && v.year >= minYear)
  }
  // legacy year filter
  if (f === '2020plus') r = r.filter((v) => v.year !== null && v.year >= 2020)

  // Destacados
  if (dest === '1' || f === 'featured') r = r.filter((v) => v.featured)

  return r
}

export default async function AutosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { tipo = '', trans = '', precio = '', anio = '', dest = '', f = '', q = '' } = await searchParams
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
  const filtered = applyFilter(vehicles, { tipo, trans, precio, anio, dest, f, q })
  const availableCount = vehicles.filter((v) => v.status !== 'sold').length

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <Hero count={availableCount} />

      <Suspense>
        <FilterBar tipo={tipo} trans={trans} precio={precio} anio={anio} dest={dest} />
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
      <footer className="px-5 md:px-10 py-8 md:py-12 mt-8" style={{ background: '#012538', color: 'rgba(255,255,255,0.7)' }}>
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div>
            <div className="mb-3">
              <Logo variant="dark" size="sm" href="/" />
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
