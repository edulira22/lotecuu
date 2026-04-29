import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PhotoGallery } from '@/components/ficha/photo-gallery'
import { ShareButton } from '@/components/ficha/share-button'
import { StatusPill } from '@/components/ui/status-pill'
import { FeaturedPill } from '@/components/ui/featured-pill'
import { Chip } from '@/components/ui/chip'
import { Logo } from '@/components/ui/logo'
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
}

type VehicleFull = {
  id: string
  title: string
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
    if (val == null) return []
    return [{ label, value: fmt(val) }]
  })
  if (specs.length === 0) return null

  return (
    <div className="grid grid-cols-2 gap-x-6">
      {specs.map((s) => (
        <div
          key={s.label}
          className="flex items-start gap-3 py-3.5 border-b-hairline border-[var(--gray-line)]"
        >
          <div className="flex flex-col gap-[2px] min-w-0">
            <span className="text-[11px] text-text-muted uppercase tracking-[0.08em] font-[500]">
              {s.label}
            </span>
            <span className="text-[14px] font-[500]">{s.value}</span>
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
        style={{ background: 'linear-gradient(90deg, #255C7A, #E56A2E)' }}
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

      {/* Contact numbers — discreet */}
      {(seller.whatsapp || seller.phone) && (
        <div
          className="flex flex-col gap-1 pt-2.5"
          style={{ borderTop: '0.5px solid var(--gray-line)' }}
        >
          {seller.whatsapp && (
            <span className="text-[11px] text-text-muted flex items-center gap-1.5">
              <WaIcon size={10} />
              {fmtPhone(seller.whatsapp)}
            </span>
          )}
          {seller.phone && (
            <span className="text-[11px] text-text-muted flex items-center gap-1.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
              </svg>
              {fmtPhone(seller.phone)}
            </span>
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

/* ── InfoContent (shared between mobile/desktop) ─────────────── */
function InfoContent({
  vehicle: v,
  waLink,
  sellerWaLink,
  callLink,
  mapsLink,
  flags,
  isMobile,
}: {
  vehicle: VehicleFull
  waLink: string | null
  sellerWaLink: string | null
  callLink: string | null
  mapsLink: string | null
  flags: string[]
  isMobile?: boolean
}) {
  return (
    <div className="flex flex-col gap-5">
      {/* Status badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <StatusPill status={v.status} />
        {v.featured && <FeaturedPill />}
      </div>

      {/* Title + version */}
      <div>
        <h1
          className="font-[500] leading-[1.1] tracking-[-0.015em] m-0"
          style={{ fontSize: isMobile ? 24 : 30 }}
        >
          {v.title}
        </h1>
        {v.version && (
          <p className="text-text-muted mt-1" style={{ fontSize: isMobile ? 14 : 16 }}>
            {v.version}
          </p>
        )}
      </div>

      {/* Price */}
      {v.price ? (
        <div className="flex items-baseline gap-2">
          <span
            className="font-[500] text-orange tracking-[-0.02em]"
            style={{ fontSize: isMobile ? 28 : 34 }}
          >
            {fmtPrice(v.price)}
          </span>
          <span className="text-[13px] text-text-muted">MXN</span>
        </div>
      ) : (
        <p className="text-[18px] text-text-muted font-[500]">Consultar precio</p>
      )}

      {/* Flags */}
      {flags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {flags.map((f) => <Chip key={f}>{f}</Chip>)}
        </div>
      )}

      {/* Desktop CTA (mobile uses sticky bottom bar) */}
      {!isMobile && (waLink ?? callLink) && (
        <div className="flex flex-col gap-2">
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
          {callLink && v.seller?.phone && (
            <CallButton
              phone={v.seller.phone}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[14px] font-[500] border-hairline border-[var(--gray-line)] text-text-base hover:border-teal hover:text-teal transition-colors"
            />
          )}
          {waLink && (
            <p className="text-[11px] text-text-muted text-center">
              &ldquo;{vehicleInquiryText(v.title)}&rdquo;
            </p>
          )}
        </div>
      )}

      {/* Specs */}
      <div>
        <p className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500] mb-1.5">
          Características
        </p>
        <SpecGrid vehicle={v} />
      </div>

      {/* Description */}
      {v.description && (
        <div>
          <p className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500] mb-2.5">
            Descripción
          </p>
          <blockquote className="text-[14px] text-text-base leading-relaxed pl-3 border-l-2 border-orange m-0">
            {v.description}
          </blockquote>
        </div>
      )}

      {/* Seller card */}
      {v.seller && (
        <SellerCard
          seller={v.seller}
          waLink={sellerWaLink}
          mapsLink={mapsLink}
        />
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

  const photos = (photosData ?? []) as unknown as PhotoRow[]
  // Cover photo first, then by sort_order
  const sortedPhotos = [...photos].sort((a, b) =>
    a.is_cover === b.is_cover ? a.sort_order - b.sort_order : a.is_cover ? -1 : 1,
  )

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
    v.financing     && 'Financiamiento disponible',
    v.single_owner  && 'Único dueño',
    v.has_debt      === false && 'Sin adeudo',
    v.has_debt      === true  && 'Con adeudo',
  ].filter(Boolean) as string[]

  const callLink = v.seller?.phone ? `tel:${v.seller.phone.replace(/\D/g, '')}` : null
  const mapsLink = v.seller?.google_maps_url ?? null

  // Fire-and-forget view event
  void supabase.from('vehicle_events').insert({
    vehicle_id: v.id,
    seller_id: v.seller?.id ?? null,
    event_type: 'view',
  })

  const topBar = (
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
      <div className="hidden md:flex flex-1 justify-center">
        <Logo size="sm" />
      </div>
      <div className="flex-1 md:flex-none" />
      <ShareButton title={v.title} price={v.price ? fmtPrice(v.price) : null} />
    </div>
  )

  return (
    <div className="min-h-screen bg-surface">
      {topBar}

      {/* ── Desktop ─────────────────────────────────── */}
      <div className="hidden md:grid md:grid-cols-[1.4fr_1fr] md:gap-10 md:px-10 md:py-8 md:items-start">
        <PhotoGallery
          photos={sortedPhotos}
          vehicleId={v.id}
          vehicleTitle={v.title}
        />
        <InfoContent
          vehicle={v}
          waLink={waLink}
          sellerWaLink={sellerWaLink}
          callLink={callLink}
          mapsLink={mapsLink}
          flags={flags}
        />

        {moreCars.length > 0 && (
          <div className="col-span-2 mt-8 pb-16">
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="text-[18px] font-[500] m-0">
                Más autos de {v.seller?.name}
              </h3>
              {v.seller && (
                <Link
                  href={`/vendedores/${v.seller.slug}`}
                  className="text-[13px] text-teal font-[500] hover:underline"
                >
                  Ver perfil completo →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {moreCars.map((c) => <MiniCard key={c.id} car={c} />)}
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile ──────────────────────────────────── */}
      <div className="md:hidden">
        <PhotoGallery
          photos={sortedPhotos}
          vehicleId={v.id}
          vehicleTitle={v.title}
        />
        <div className="px-5 py-5 pb-32">
          <InfoContent
            vehicle={v}
            waLink={waLink}
            sellerWaLink={sellerWaLink}
            callLink={callLink}
            mapsLink={mapsLink}
            flags={flags}
            isMobile
          />

          {moreCars.length > 0 && (
            <div className="mt-6">
              <p className="text-[16px] font-[500] mb-3">Más autos de {v.seller?.name}</p>
              <div className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {moreCars.map((c) => (
                  <div key={c.id} className="min-w-[200px] shrink-0">
                    <MiniCard car={c} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky mobile bottom CTA */}
        {(waLink ?? callLink) && (
          <div
            className="fixed bottom-0 left-0 right-0 z-40 flex items-center gap-2 px-4 py-3 bg-surface border-t-hairline border-[var(--gray-line)]"
            style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.08)' }}
          >
            {/* Price */}
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[10px] text-text-muted">Precio</span>
              <span className="text-[17px] font-[500] text-orange leading-tight">
                {v.price ? fmtPrice(v.price) : 'Consultar'}
              </span>
            </div>

            {/* Call — icon only, mobile → tel: directly */}
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

            {/* Share — icon only */}
            <ShareButton
              title={v.title}
              price={v.price ? fmtPrice(v.price) : null}
              iconOnly
            />

            {/* WhatsApp — primary CTA */}
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
    </div>
  )
}
