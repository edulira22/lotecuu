import Link from 'next/link'
import Image from 'next/image'
import { CarPlaceholder, getPlaceholderTone } from '@/components/ui/car-placeholder'
import { StatusPill } from '@/components/ui/status-pill'
import { FeaturedPill } from '@/components/ui/featured-pill'
import { Chip } from '@/components/ui/chip'
import { fmtPrice, fmtKm } from '@/lib/format'
import { buildWhatsAppLink, vehicleInquiryText } from '@/lib/whatsapp'
import type { VehicleStatus } from '@/lib/supabase/database.types'

export interface FeedVehicle {
  id: string
  title: string
  version: string | null
  status: VehicleStatus
  year: number | null
  price: number | null
  mileage: number | null
  transmission: string | null
  body_type: string | null
  featured: boolean
  slug: string
  seller: { id: string; name: string; whatsapp: string } | null
  photos: { url: string; is_cover: boolean; sort_order: number }[] | null
}

interface CarCardProps {
  vehicle: FeedVehicle
  wide?: boolean
}

export function CarCard({ vehicle: v, wide = false }: CarCardProps) {
  const dimmed = v.status === 'sold'
  const cover = v.photos?.find((p) => p.is_cover) ?? v.photos?.[0] ?? null
  const tone = getPlaceholderTone(v.id)

  const chips: string[] = [
    v.year ? String(v.year) : null,
    v.mileage ? fmtKm(v.mileage) : null,
    v.transmission ?? null,
    v.body_type ?? null,
  ].filter(Boolean) as string[]

  const waLink = v.seller?.whatsapp
    ? buildWhatsAppLink(v.seller.whatsapp, vehicleInquiryText(v.title))
    : null

  return (
    <article
      className={[
        'rounded-card overflow-hidden flex flex-col bg-white border-hairline border-[var(--gray-line)] transition-opacity',
        dimmed ? 'opacity-60' : '',
        wide ? 'md:col-span-2' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Link href={`/autos/${v.slug}`} className="block relative" style={{ height: wide ? 230 : 168 }}>
        {cover ? (
          <Image
            src={cover.url}
            alt={v.title}
            fill
            className="object-cover"
            sizes={wide ? '(max-width: 768px) 100vw, 66vw' : '(max-width: 768px) 100vw, 33vw'}
          />
        ) : (
          <CarPlaceholder tone={tone} className="absolute inset-0" />
        )}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          <StatusPill status={v.status} />
        </div>
        {v.featured && (
          <div className="absolute top-2.5 right-2.5">
            <FeaturedPill />
          </div>
        )}
      </Link>

      <div className="flex flex-col gap-2 p-3.5 flex-1">
        <div className="flex flex-col gap-0.5">
          <Link href={`/autos/${v.slug}`} className="text-[14px] font-[500] leading-snug hover:text-orange transition-colors">
            {v.title}
            {v.version && (
              <span className="text-text-muted font-[400]"> · {v.version}</span>
            )}
          </Link>
          {v.price ? (
            <div className="text-[18px] font-[500] text-orange tracking-tight">
              {fmtPrice(v.price)}
            </div>
          ) : (
            <div className="text-[13px] text-text-muted font-[400]">Consultar precio</div>
          )}
        </div>

        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <Chip key={c}>{c}</Chip>
            ))}
          </div>
        )}

        <div className="flex-1" />
        <div className="border-t-hairline border-[var(--gray-line)]" />

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[13px] text-text-base font-[500] truncate">
              {v.seller?.name ?? ''}
            </span>
          </div>
          {v.status === 'sold' ? (
            <Link
              href={`/autos/${v.slug}`}
              className="shrink-0 px-3 py-1.5 rounded-pill text-[11px] font-[500] border-hairline border-[var(--gray-line)] text-text-muted hover:text-text-base transition-colors"
            >
              Ver ficha
            </Link>
          ) : waLink ? (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-[11px] font-[500] bg-whatsapp text-white hover:opacity-90 transition-opacity"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
          ) : null}
        </div>
      </div>
    </article>
  )
}
