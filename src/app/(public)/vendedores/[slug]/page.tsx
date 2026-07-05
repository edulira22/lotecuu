import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Logo } from '@/components/ui/logo'
import { StatusPill } from '@/components/ui/status-pill'
import { InventoryTabs } from '@/components/seller/inventory-tabs'
import { fmtPrice, fmtKm } from '@/lib/format'
import { buildWhatsAppLink } from '@/lib/whatsapp'
import type { VehicleStatus } from '@/lib/supabase/database.types'

type SellerRow = {
  id: string
  name: string
  business_name: string | null
  slug: string
  whatsapp: string
  phone: string | null
  email: string | null
  description: string | null
  address: string | null
  google_maps_url: string | null
  created_at: string
}

type VehicleRow = {
  id: string
  title: string
  price: number | null
  mileage: number | null
  year: number | null
  status: VehicleStatus
  slug: string
  featured: boolean
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('sellers')
    .select('name, business_name')
    .eq('slug', slug)
    .single()
  if (!data) return { title: 'Vendedor no encontrado' }
  const s = data as { name: string; business_name: string | null }
  return {
    title: `${s.business_name ?? s.name} — LoteCUU`,
    description: `Inventario de ${s.name} en Chihuahua · LoteCUU`,
  }
}

export default async function VendedorPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { slug } = await params
  const { tab = 'all' } = await searchParams
  const supabase = await createClient()

  const { data: sellerData } = await supabase
    .from('sellers')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .single()

  if (!sellerData) notFound()
  const seller = sellerData as unknown as SellerRow

  const { data: vehiclesData } = await supabase
    .from('vehicles')
    .select('id, title, price, mileage, year, status, slug, featured')
    .eq('seller_id', seller.id)
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })

  const allVehicles = (vehiclesData ?? []) as unknown as VehicleRow[]

  // Filter by tab
  const filtered =
    tab === 'all'
      ? allVehicles
      : allVehicles.filter((v) => v.status === tab)

  // Stats
  const published = allVehicles.filter((v) => v.status === 'published').length
  const reserved  = allVehicles.filter((v) => v.status === 'reserved').length
  const sold      = allVehicles.filter((v) => v.status === 'sold').length
  const since     = new Date(seller.created_at).getFullYear()

  const waLink = buildWhatsAppLink(
    seller.whatsapp,
    `Hola, vi el perfil de ${seller.name} en LoteCUU. ¿Me pueden dar más información?`,
  )

  return (
    <div className="min-h-screen bg-surface">
      {/* Top bar */}
      <div className="sticky top-0 z-30 flex items-center gap-4 px-5 md:px-10 py-3 bg-surface border-b-hairline border-[var(--gray-line)]">
        <Link
          href="/autos"
          className="inline-flex items-center gap-1.5 text-[13px] font-[500] text-text-base hover:text-orange transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          <span className="hidden md:inline">Volver al feed</span>
        </Link>
        <div className="flex-1 flex justify-center">
          <Logo size="sm" />
        </div>
        <div style={{ width: 80 }} />
      </div>

      {/* Hero */}
      <section
        className="relative overflow-hidden px-5 py-7 md:px-10 md:py-12"
        style={{
          background: 'linear-gradient(135deg, #1A4D6B 0%, #1E3A4A 60%, rgba(229,106,46,0.4) 100%)',
          color: '#fff',
        }}
      >
        {/* Decorative stripes */}
        <svg
          className="absolute top-0 right-0 w-[380px] h-full opacity-[0.18] pointer-events-none hidden md:block"
          viewBox="0 0 380 240"
          preserveAspectRatio="none"
        >
          <g stroke="#fff" strokeWidth="1.4" fill="none">
            <path d="M40 0 L120 240" /><path d="M120 0 L200 240" /><path d="M210 0 L290 240" />
          </g>
        </svg>

        <div className="relative flex flex-col md:flex-row md:items-end gap-4 md:gap-7">
          {/* Logo plate */}
          <div
            className="inline-flex shrink-0 p-3.5 md:p-5 rounded-[18px]"
            style={{ background: 'rgba(255,255,255,0.96)', boxShadow: '0 12px 40px rgba(0,0,0,0.18)' }}
          >
            <div className="w-[72px] h-[72px] md:w-24 md:h-24 flex items-center justify-center rounded-xl bg-surface-alt">
              <span className="text-[28px] md:text-[36px] font-[600] text-teal tracking-tight">
                {seller.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 flex-1 min-w-0">
            <span
              className="self-start text-[10px] uppercase tracking-[0.14em] font-[500] px-2.5 py-1 rounded-pill"
              style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}
            >
              ✓ Vendedor verificado
            </span>
            <h1 className="text-[30px] md:text-[46px] font-[500] m-0 leading-[1.05] tracking-[-0.02em]">
              {seller.business_name ?? seller.name}
            </h1>
            {seller.description && (
              <p className="text-[14px] md:text-[16px] opacity-88 max-w-[600px] m-0">
                {seller.description}
              </p>
            )}
          </div>

          <div className="hidden md:flex shrink-0 items-center gap-2">
            {seller.phone && (
              <a
                href={`tel:${seller.phone.replace(/\D/g, '')}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-[500] bg-white/15 hover:bg-white/25 transition-colors text-white"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z" />
                </svg>
                Llamar
              </a>
            )}
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-[500] bg-white hover:opacity-90 transition-opacity"
              style={{ color: '#1A4D6B' }}
            >
              <WaIcon size={16} />
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div
        className="grid grid-cols-2 md:grid-cols-4 bg-white border-b-hairline border-[var(--gray-line)]"
        style={{ borderTop: '0.5px solid var(--gray-line)' }}
      >
        {[
          { label: 'Disponibles', value: published, suffix: 'autos' },
          { label: 'Apartados',   value: reserved,  suffix: 'vehículos' },
          { label: 'Vendidos',    value: sold,       suffix: 'históricos' },
          { label: 'Desde',       value: since,      suffix: 'en LoteCUU' },
        ].map((s, i) => (
          <div
            key={s.label}
            className="flex flex-col gap-1 px-5 py-4 md:px-7 md:py-5"
            style={{
              borderRight: i % 2 === 0 || i < 3 ? '0.5px solid var(--gray-line)' : 'none',
              borderBottom: i < 2 ? '0.5px solid var(--gray-line)' : 'none',
            }}
          >
            <span className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500]">
              {s.label}
            </span>
            <span className="text-[26px] md:text-[28px] font-[500] leading-none tracking-[-0.015em]">
              {s.value}
            </span>
            <span className="text-[12px] text-text-muted">{s.suffix}</span>
          </div>
        ))}
      </div>

      {/* Content: inventory + sidebar */}
      <div className="px-5 py-6 md:px-10 md:py-9 grid grid-cols-1 md:grid-cols-[1fr_320px] gap-7 md:gap-10 pb-16">
        {/* Inventory */}
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-[20px] md:text-[24px] font-[500] m-0 tracking-tight">
              Autos en venta
            </h2>
            <span className="text-[13px] text-text-muted">{filtered.length} resultados</span>
          </div>

          <div className="mb-5">
            <Suspense>
              <InventoryTabs active={tab} />
            </Suspense>
          </div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {filtered.map((car) => (
                <SellerVehicleCard key={car.id} car={car} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-text-muted text-[14px] bg-surface-alt rounded-xl">
              Sin vehículos en este filtro.
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-6 order-first md:order-none">
          {seller.description && (
            <div>
              <p className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500] mb-2">
                Sobre el lote
              </p>
              <p className="text-[14px] leading-relaxed m-0">{seller.description}</p>
            </div>
          )}

          {/* Contact info */}
          <div className="flex flex-col gap-0">
            <p className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500] mb-1">
              Contacto
            </p>
            {seller.address && (
              <ContactRow icon="pin" label="Ubicación" value={seller.address} href={seller.google_maps_url ?? undefined} />
            )}
            {seller.phone && (
              <ContactRow icon="phone" label="Teléfono" value={seller.phone} href={`tel:${seller.phone}`} />
            )}
            <ContactRow
              icon="whatsapp"
              label="WhatsApp"
              value={seller.whatsapp}
              href={waLink}
            />
            {seller.email && (
              <ContactRow icon="mail" label="Correo" value={seller.email} href={`mailto:${seller.email}`} />
            )}
          </div>

          <div className="flex gap-2">
            {seller.phone && (
              <a
                href={`tel:${seller.phone.replace(/\D/g, '')}`}
                className="flex flex-1 items-center justify-center gap-2 py-3.5 rounded-xl text-[14px] font-[500] transition-colors"
                style={{ border: '0.5px solid var(--gray-line-strong)', color: 'var(--text-base)' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z" />
                </svg>
                Llamar
              </a>
            )}
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 py-3.5 rounded-xl text-[14px] font-[500] text-white transition-colors"
              style={{ background: '#25D366' }}
            >
              <WaIcon size={16} />
              WhatsApp
            </a>
          </div>
        </aside>
      </div>
    </div>
  )
}

/* ── Sub-components ──────────────────────────────────────────── */

function SellerVehicleCard({ car }: { car: VehicleRow }) {
  return (
    <Link
      href={`/autos/${car.slug}`}
      className="block rounded-card overflow-hidden border-hairline border-[var(--gray-line)] bg-white hover:border-[var(--gray-line-strong)] transition-colors"
      style={{ opacity: car.status === 'sold' ? 0.6 : 1 }}
    >
      <div className="relative h-[160px] bg-surface-alt">
        <StatusPill status={car.status} className="absolute top-2 left-2" />
      </div>
      <div className="p-3 flex flex-col gap-1">
        <p className="text-[14px] font-[500] leading-snug">{car.title}</p>
        {car.price ? (
          <p className="text-[16px] font-[500] text-orange">{fmtPrice(car.price)}</p>
        ) : (
          <p className="text-[13px] text-text-muted">Consultar precio</p>
        )}
        {(car.year ?? car.mileage) && (
          <p className="text-[12px] text-text-muted">
            {[car.year, car.mileage ? fmtKm(car.mileage) : null]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
      </div>
    </Link>
  )
}

function ContactRow({
  icon,
  label,
  value,
  href,
}: {
  icon: 'pin' | 'phone' | 'whatsapp' | 'mail'
  label: string
  value: string
  href?: string
}) {
  const icons: Record<string, React.ReactNode> = {
    pin: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
      </svg>
    ),
    mail: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    phone: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z" />
      </svg>
    ),
    whatsapp: <WaIcon size={14} />,
  }

  const inner = (
    <div className="flex items-center gap-3 py-3.5 border-b-hairline border-[var(--gray-line)]">
      <span className="w-8 h-8 rounded-lg bg-surface-alt flex items-center justify-center text-teal shrink-0">
        {icons[icon]}
      </span>
      <div className="flex flex-col gap-[2px] min-w-0">
        <span className="text-[11px] text-text-muted uppercase tracking-[0.08em] font-[500]">{label}</span>
        <span className="text-[14px] font-[500] truncate">{value}</span>
      </div>
    </div>
  )

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
        {inner}
      </a>
    )
  }
  return inner
}

function WaIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}
