import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AdaptiveGallery } from '@/components/ficha/adaptive-gallery'
import { RevealText } from '@/components/ui/reveal-text'
import { ScrambleValue } from '@/components/ui/scramble-value'
import { sortPhotos } from '@/lib/photo-angles'
import { ShareButton } from '@/components/ficha/share-button'
import { StatusPill } from '@/components/ui/status-pill'
import { FeaturedPill } from '@/components/ui/featured-pill'
import { Chip } from '@/components/ui/chip'
import { AnimatedLogo } from '@/components/ui/animated-logo'
import { CarPlaceholder, getPlaceholderTone } from '@/components/ui/car-placeholder'
import { fmtPrice, fmtKm, fmtPhone } from '@/lib/format'
import { buildWhatsAppLink, vehicleInquiryText } from '@/lib/whatsapp'
import { CallButton } from '@/components/ficha/call-button'
import type { VehicleStatus } from '@/lib/supabase/database.types'

/* ── Local types ─────────────────────────────────────────────── */
type SellerRow = {
  id: string
  name: string
  business_name: string | null
  whatsapp: string
  phone: string | null
  email: string | null
  phone2?: string | null
  whatsapp2?: string | null
  address: string | null
  google_maps_url: string | null
  slug: string
}

type PhotoRow = {
  id: string
  url: string
  is_cover: boolean
  sort_order: number
  alt_text: string | null
  angle?: string | null
}

type VehicleFull = {
  id: string
  title: string
  brand: string | null
  model: string | null
  version: string | null
  status: VehicleStatus
  year: number | null
  price: number | null
  mileage: number | null
  transmission: string | null
  fuel: string | null
  body_type: string | null
  color: string | null
  condition: string | null
  negotiable: boolean | null
  accepts_trade: boolean | null
  financing: boolean | null
  financing_details?: string | null
  has_debt: boolean | null
  single_owner: boolean | null
  origin: 'nacional' | 'importado' | null
  doors: number | null
  cylinders: number | null
  drive_type: string | null
  description: string | null
  featured: boolean
  slug: string
  seller: SellerRow | null
}

/* ── Metadata ────────────────────────────────────────────────── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('vehicles')
    .select('title, price')
    .eq('slug', slug)
    .single()
  if (!data) return { title: 'Vehículo no encontrado' }
  const row = data as { title: string; price: number | null }
  return {
    title: `${row.title} — LoteCUU`,
    description: row.price
      ? `${fmtPrice(row.price)} MXN · Autos usados en Chihuahua`
      : 'Autos usados en Chihuahua · LoteCUU',
  }
}

/* ── SpecGrid ────────────────────────────────────────────────── */
const SPEC_KEYS = [
  { label: 'Año',          key: 'year',         fmt: (v: unknown) => String(v) },
  { label: 'Kilometraje',  key: 'mileage',      fmt: (v: unknown) => fmtKm(v as number) },
  { label: 'Transmisión',  key: 'transmission', fmt: (v: unknown) => String(v) },
  { label: 'Combustible',  key: 'fuel',         fmt: (v: unknown) => String(v) },
  { label: 'Tipo',         key: 'body_type',    fmt: (v: unknown) => String(v) },
  { label: 'Color',        key: 'color',        fmt: (v: unknown) => String(v) },
  { label: 'Condición',    key: 'condition',    fmt: (v: unknown) => String(v) },
  { label: 'Puertas',      key: 'doors',        fmt: (v: unknown) => String(v) },
  { label: 'Cilindros',    key: 'cylinders',    fmt: (v: unknown) => String(v) },
  { label: 'Tracción',     key: 'drive_type',   fmt: (v: unknown) => String(v) },
  { label: 'Origen',       key: 'origin',       fmt: (v: unknown) => v === 'nacional' ? 'Nacional' : 'Importado' },
] as const

function SpecGrid({ vehicle }: { vehicle: VehicleFull }) {
  const specs = SPEC_KEYS.flatMap(({ label, key, fmt }) => {
    const val = vehicle[key as keyof VehicleFull]
    if (val == null || val === '' || (key === 'mileage' && val === 0)) return []
    return [{ label, value: fmt(val) }]
  })
  if (specs.length === 0) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6">
      {specs.map((s, i) => (
        <div
          key={s.label}
          className="flex items-start gap-3 py-3.5 border-b-hairline border-[var(--gray-line)]"
        >
          <div className="flex flex-col gap-[2px] min-w-0">
            <span className="text-[11px] text-text-muted uppercase tracking-[0.08em] font-[500]">
              {s.label}
            </span>
            <ScrambleValue value={s.value} delay={i * 60} className="text-[14px] font-[500]" />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── WhatsApp icon ───────────────────────────────────────────── */
function WaIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

/* ── SellerCard ──────────────────────────────────────────────── */
function SellerCard({
  seller,
  waLink,
  mapsLink,
}: {
  seller: SellerRow
  waLink: string | null
  mapsLink: string | null
}) {
  return (
    <div className="relative rounded-xl border-hairline border-[var(--gray-line)] bg-white overflow-hidden p-4 flex flex-col gap-3">
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: 'linear-gradient(90deg, #1B768E, #FB9833)' }}
      />
      <div className="flex flex-col gap-0.5 mt-1">
        <span className="text-[10px] text-text-muted uppercase tracking-[0.1em] font-[500]">
          Vendedor
        </span>
        <span className="text-[16px] font-[500] text-teal">{seller.name}</span>
        {seller.business_name && (
          <span className="text-[12px] text-text-muted">{seller.business_name}</span>
        )}
        {seller.address && (
          <span className="text-[12px] text-text-muted flex items-center gap-1 mt-0.5">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {seller.address}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-[13px] font-[500] bg-whatsapp text-white hover:opacity-90 transition-opacity"
          >
            <WaIcon size={14} />
            WhatsApp
          </a>
        )}
        <div className="flex gap-2">
          {seller.phone && (
            <CallButton
              phone={seller.phone}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[13px] font-[500] border-hairline border-[var(--gray-line)] text-text-base hover:border-teal hover:text-teal transition-colors"
            />
          )}
          {mapsLink && (
            <a
              href={mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[13px] font-[500] border-hairline border-[var(--gray-line)] text-text-base hover:border-teal hover:text-teal transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              Ubicación
            </a>
          )}
        </div>
      </div>

      {/* Contact info — discreet */}
      {(seller.whatsapp || seller.phone || seller.email || seller.whatsapp2 || seller.phone2) && (
        <div
          className="flex flex-col gap-1 pt-2.5"
          style={{ borderTop: '0.5px solid var(--gray-line)' }}
        >
          {[seller.whatsapp, seller.whatsapp2].filter(Boolean).map((n) => (
            <a
              key={`wa-${n}`}
              href={buildWhatsAppLink(n!, `Hola, vi a ${seller.name} en LoteCUU.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-text-muted flex items-center gap-1.5 hover:text-teal transition-colors"
            >
              <WaIcon size={10} />
              {fmtPhone(n!)}
            </a>
          ))}
          {[seller.phone, seller.phone2].filter(Boolean).map((n) => (
            <a
              key={`tel-${n}`}
              href={`tel:${n!.replace(/\D/g, '')}`}
              className="text-[11px] text-text-muted flex items-center gap-1.5 hover:text-teal transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
              </svg>
              {fmtPhone(n!)}
            </a>
          ))}
          {seller.email && (
            <a
              href={`mailto:${seller.email}`}
              className="text-[11px] text-text-muted flex items-center gap-1.5 hover:text-teal transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              {seller.email}
            </a>
          )}
        </div>
      )}

      <Link
        href={`/vendedores/${seller.slug}`}
        className="text-[13px] text-teal font-[500] inline-flex items-center gap-1 hover:underline"
      >
        Ver todos sus autos
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  )
}

/* ── MiniCard ────────────────────────────────────────────────── */
function MiniCard({
  car,
}: {
  car: {
    id: string
    title: string
    price: number | null
    status: VehicleStatus
    slug: string
    coverUrl: string | null
  }
}) {
  const tone = getPlaceholderTone(car.id)
  return (
    <Link
      href={`/autos/${car.slug}`}
      className="block rounded-card overflow-hidden border-hairline border-[var(--gray-line)] bg-white hover:border-[var(--gray-line-strong)] transition-colors"
    >
      <div className="relative h-[130px]" style={{ background: '#0E1218' }}>
        {car.coverUrl ? (
          <Image
            src={car.coverUrl}
            alt={car.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 200px, 260px"
          />
        ) : (
          <CarPlaceholder tone={tone} className="absolute inset-0" />
        )}
        <StatusPill status={car.status} className="absolute top-2 left-2 z-[1]" />
      </div>
      <div className="p-3 flex flex-col gap-0.5">
        <p className="text-[13px] font-[500] leading-snug">{car.title}</p>
        {car.price ? (
          <p className="text-[14px] font-[500] text-orange">{fmtPrice(car.price)}</p>
        ) : (
          <p className="text-[12px] text-text-muted">Consultar precio</p>
        )}
      </div>
    </Link>
  )
}

/* ── KeySpecs: showroom-style big numbers under the stage ────── */
const numberFmt = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 })

function KeySpecs({ vehicle: v }: { vehicle: VehicleFull }) {
  const items = [
    v.year != null ? { label: 'Año', value: String(v.year) } : null,
    v.mileage ? { label: 'Kilometraje', value: numberFmt.format(v.mileage), unit: 'km' } : null,
    v.transmission ? { label: 'Transmisión', value: v.transmission } : null,
    v.cylinders != null
      ? { label: 'Motor', value: String(v.cylinders), unit: 'cil.' }
      : v.fuel
        ? { label: 'Combustible', value: v.fuel }
        : null,
  ].filter(Boolean) as { label: string; value: string; unit?: string }[]

  if (items.length === 0) return null

  return (
    <dl className="grid grid-cols-2 sm:flex sm:flex-wrap gap-x-8 gap-y-4 lg:gap-x-10 m-0">
      {items.map((s, i) => (
        <div key={s.label} className="flex flex-col gap-1 min-w-0">
          <dt className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500]">{s.label}</dt>
          <dd className="m-0 text-[20px] md:text-[24px] font-[500] tracking-[-0.015em] leading-none whitespace-nowrap">
            <ScrambleValue value={s.value} delay={i * 110} />
            {s.unit && <span className="text-[13px] text-text-muted font-[400] ml-1">{s.unit}</span>}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/* ── FinancingBlock ──────────────────────────────────────────── */
function FinancingBlock({ details, askLink }: { details: string | null; askLink: string | null }) {
  return (
    <div
      className="rounded-[6px] p-5 flex flex-col sm:flex-row sm:items-center gap-4"
      style={{ background: 'var(--color-teal-soft)', borderLeft: '3px solid var(--color-teal)' }}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <span className="w-9 h-9 shrink-0 rounded-[4px] flex items-center justify-center text-white" style={{ background: 'var(--color-teal)' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h4" />
          </svg>
        </span>
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-[15px] font-[500] text-teal">Financiamiento disponible</span>
          <p className="text-[13px] text-text-base leading-relaxed m-0 whitespace-pre-line">
            {details || 'Pregunta al vendedor por enganche, plazos y requisitos.'}
          </p>
        </div>
      </div>
      {askLink && (
        <a
          href={askLink}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[4px] text-[13px] font-[500] text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--color-teal)' }}
        >
          <WaIcon size={14} />
          Preguntar por financiamiento
        </a>
      )}
    </div>
  )
}

/* ── ContactPanel (desktop; mobile uses the sticky bar) ──────── */
function ContactPanel({
  vehicle: v,
  waLink,
  callLink,
}: {
  vehicle: VehicleFull
  waLink: string | null
  callLink: string | null
}) {
  if (!waLink && !callLink && !v.seller?.email) return null
  return (
    <div className="hidden md:flex flex-col gap-3 rounded-xl border-hairline border-[var(--gray-line)] bg-white p-5">
      <span className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500]">¿Te interesa?</span>
      {v.price ? (
        <div className="flex items-baseline gap-2">
          <ScrambleValue value={fmtPrice(v.price)} className="text-[26px] font-[500] text-orange tracking-[-0.02em] leading-none" />
          <span className="text-[12px] text-text-muted">MXN</span>
        </div>
      ) : (
        <span className="text-[16px] text-text-muted font-[500]">Consultar precio</span>
      )}
      {waLink && (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-[15px] font-[500] text-white bg-orange hover:bg-orange-deep transition-colors"
        >
          <WaIcon size={18} />
          Contactar al vendedor
        </a>
      )}
      {(callLink || v.seller?.email) && (
        <div className="flex gap-2">
          {callLink && v.seller?.phone && (
            <CallButton
              phone={v.seller.phone}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[14px] font-[500] border-hairline border-[var(--gray-line)] text-text-base hover:border-teal hover:text-teal transition-colors"
            />
          )}
          {v.seller?.email && (
            <a
              href={`mailto:${v.seller.email}?subject=${encodeURIComponent(`Interés en ${v.title} — LoteCUU`)}`}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[14px] font-[500] border-hairline border-[var(--gray-line)] text-text-base hover:border-teal hover:text-teal transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              Correo
            </a>
          )}
        </div>
      )}
      {(v.seller?.whatsapp2 || v.seller?.phone2) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-text-muted">
          <span>También:</span>
          {v.seller?.whatsapp2 && (
            <a
              href={buildWhatsAppLink(v.seller.whatsapp2, vehicleInquiryText(v.title))}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-teal transition-colors"
            >
              <WaIcon size={11} /> {fmtPhone(v.seller.whatsapp2)}
            </a>
          )}
          {v.seller?.phone2 && (
            <a href={`tel:${v.seller.phone2.replace(/\D/g, '')}`} className="hover:text-teal transition-colors">
              Tel. {fmtPhone(v.seller.phone2)}
            </a>
          )}
        </div>
      )}
      {waLink && (
        <p className="text-[11px] text-text-muted text-center m-0">
          &ldquo;{vehicleInquiryText(v.title)}&rdquo;
        </p>
      )}
    </div>
  )
}

/* ── Page ────────────────────────────────────────────────────── */
export default async function FichaPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: vehicleData } = await supabase
    .from('vehicles')
    .select('*, seller:sellers(*)')
    .eq('slug', slug)
    .single()

  if (!vehicleData) notFound()
  const v = vehicleData as unknown as VehicleFull

  const [{ data: photosData }, { data: moreRaw }] = await Promise.all([
    supabase
      .from('vehicle_photos')
      .select('*')
      .eq('vehicle_id', v.id)
      .order('sort_order'),
    v.seller
      ? supabase
          .from('vehicles')
          .select('id, title, price, status, slug, vehicle_photos(url, is_cover, sort_order)')
          .eq('seller_id', v.seller.id)
          .neq('id', v.id)
          .in('status', ['published', 'reserved'])
          .limit(3)
      : Promise.resolve({ data: [] }),
  ])

  // Cover first, then posed photos in a fixed order, then the rest
  const sortedPhotos = sortPhotos((photosData ?? []) as unknown as PhotoRow[])

  type MiniCarRaw = {
    id: string
    title: string
    price: number | null
    status: VehicleStatus
    slug: string
    vehicle_photos: { url: string; is_cover: boolean; sort_order: number }[]
  }
  const moreCars = ((moreRaw ?? []) as unknown as MiniCarRaw[]).map((c) => {
    const cover =
      c.vehicle_photos?.find((p) => p.is_cover) ??
      c.vehicle_photos?.sort((a, b) => a.sort_order - b.sort_order)[0] ??
      null
    return { id: c.id, title: c.title, price: c.price, status: c.status, slug: c.slug, coverUrl: cover?.url ?? null }
  })

  const waLink =
    v.seller?.whatsapp && v.status !== 'sold'
      ? buildWhatsAppLink(v.seller.whatsapp, vehicleInquiryText(v.title))
      : null

  const sellerWaLink = v.seller?.whatsapp
    ? buildWhatsAppLink(
        v.seller.whatsapp,
        `Hola, vi a ${v.seller.name} en LoteCUU. ¿Me pueden dar más información?`,
      )
    : null

  const flags = [
    v.negotiable    && 'Precio negociable',
    v.accepts_trade && 'Acepta cambio',
    v.single_owner  && 'Único dueño',
    v.has_debt      === false && 'Sin adeudo',
    v.has_debt      === true  && 'Con adeudo',
  ].filter(Boolean) as string[]

  const callLink = v.seller?.phone ? `tel:${v.seller.phone.replace(/\D/g, '')}` : null
  const mapsLink = v.seller?.google_maps_url ?? null

  const eyebrow = [v.brand, v.body_type].filter(Boolean).join(' · ')

  // Fire-and-forget view event
  void supabase.from('vehicle_events').insert({
    vehicle_id: v.id,
    seller_id: v.seller?.id ?? null,
    event_type: 'view',
  })

  return (
    <div className="min-h-screen bg-surface">
      {/* Top bar */}
      <div className="sticky top-0 z-30 flex items-center gap-4 px-5 md:px-10 py-3 bg-surface/90 backdrop-blur-md border-b-hairline border-[var(--gray-line)]">
        <Link
          href="/autos"
          className="inline-flex items-center gap-1.5 text-[13px] font-[500] text-text-base hover:text-orange transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          <span className="hidden md:inline">Volver al catálogo</span>
        </Link>
        <div className="hidden md:flex flex-1 justify-center">
          <AnimatedLogo size="sm" />
        </div>
        <div className="flex-1 md:flex-none" />
        <ShareButton title={v.title} price={v.price ? fmtPrice(v.price) : null} />
      </div>

      {/* ── Adaptive gallery ── */}
      <section className="px-5 md:px-10 pt-5 md:pt-8">
        <AdaptiveGallery photos={sortedPhotos} vehicleId={v.id} vehicleTitle={v.title} />
      </section>

      {/* ── Identity · key specs · price ── */}
      <section className="px-5 md:px-10 mt-6 md:mt-8">
        <div className="flex flex-col lg:flex-row lg:items-end gap-6 lg:gap-12 pb-7 md:pb-9 border-b-hairline border-[var(--gray-line)]">
          <div className="min-w-0 lg:flex-1 flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {eyebrow && (
                <span className="text-[11px] uppercase tracking-[0.14em] font-[500] text-teal">{eyebrow}</span>
              )}
              <StatusPill status={v.status} />
              {v.featured && <FeaturedPill />}
            </div>
            <h1 className="text-[28px] md:text-[40px] font-[500] leading-[1.05] tracking-[-0.02em] m-0">
              <RevealText delay={200}>{v.title}</RevealText>
            </h1>
            {v.version && <p className="text-[15px] md:text-[17px] text-text-muted m-0">{v.version}</p>}
          </div>

          <KeySpecs vehicle={v} />

          <div className="lg:text-right shrink-0">
            <span className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500]">Precio</span>
            {v.price ? (
              <div className="flex items-baseline gap-2 lg:justify-end mt-1">
                <ScrambleValue value={fmtPrice(v.price)} delay={250} className="text-[30px] md:text-[38px] font-[500] text-orange tracking-[-0.02em] leading-none" />
                <span className="text-[13px] text-text-muted">MXN</span>
              </div>
            ) : (
              <div className="text-[18px] text-text-muted font-[500] mt-1">Consultar precio</div>
            )}
          </div>
        </div>
      </section>

      {/* ── Details + sticky contact ── */}
      <section className="px-5 md:px-10 pt-7 md:pt-10 grid lg:grid-cols-[minmax(0,1fr)_380px] gap-8 lg:gap-14 items-start">
        <div className="flex flex-col gap-8 min-w-0">
          {flags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {flags.map((f) => <Chip key={f}>{f}</Chip>)}
            </div>
          )}

          {v.financing && (
            <FinancingBlock
              details={v.financing_details ?? null}
              askLink={
                v.seller?.whatsapp && v.status !== 'sold'
                  ? buildWhatsAppLink(
                      v.seller.whatsapp,
                      `Hola, me interesa el ${v.title} que vi en LoteCUU con financiamiento. ¿Qué opciones de enganche y plazos manejan?`,
                    )
                  : null
              }
            />
          )}

          <div>
            <p className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500] mb-1.5">
              Características
            </p>
            <SpecGrid vehicle={v} />
          </div>

          {v.description && (
            <div>
              <p className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500] mb-2.5">
                Descripción
              </p>
              <blockquote className="text-[15px] text-text-base leading-relaxed pl-3 border-l-2 border-orange m-0 whitespace-pre-line">
                {v.description}
              </blockquote>
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-[76px]">
          <ContactPanel vehicle={v} waLink={waLink} callLink={callLink} />
          {v.seller && <SellerCard seller={v.seller} waLink={sellerWaLink} mapsLink={mapsLink} />}
        </aside>
      </section>

      {/* ── More from seller ── */}
      {moreCars.length > 0 && (
        <section className="px-5 md:px-10 mt-12 md:mt-16">
          <div className="flex items-baseline justify-between mb-4 gap-3">
            <h3 className="text-[16px] md:text-[18px] font-[500] m-0">Más autos de {v.seller?.name}</h3>
            {v.seller && (
              <Link
                href={`/vendedores/${v.seller.slug}`}
                className="hidden md:inline text-[13px] text-teal font-[500] hover:underline"
              >
                Ver perfil completo →
              </Link>
            )}
          </div>
          <div className="flex md:grid md:grid-cols-3 gap-3 md:gap-4 overflow-x-auto md:overflow-visible no-scrollbar pb-2">
            {moreCars.map((c) => (
              <div key={c.id} className="min-w-[200px] md:min-w-0 shrink-0 md:shrink">
                <MiniCard car={c} />
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="h-32 md:h-16" />

      {/* Sticky mobile bottom CTA */}
      {(waLink ?? callLink) && (
        <div
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center gap-2 px-4 py-3 bg-surface border-t-hairline border-[var(--gray-line)]"
          style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.08)' }}
        >
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[10px] text-text-muted">Precio</span>
            <span className="text-[17px] font-[500] text-orange leading-tight">
              {v.price ? fmtPrice(v.price) : 'Consultar'}
            </span>
          </div>

          {v.seller?.phone && (
            <a
              href={`tel:${v.seller.phone.replace(/\D/g, '')}`}
              className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center border-hairline border-[var(--gray-line)] text-text-base hover:text-teal hover:border-teal transition-colors"
              aria-label="Llamar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
              </svg>
            </a>
          )}

          <ShareButton title={v.title} price={v.price ? fmtPrice(v.price) : null} iconOnly />

          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl text-[14px] font-[500] text-white bg-orange hover:bg-orange-deep transition-colors"
            >
              <WaIcon size={16} />
              Contactar
            </a>
          )}
        </div>
      )}
    </div>
  )
}
