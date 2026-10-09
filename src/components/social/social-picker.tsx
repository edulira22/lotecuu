import Link from 'next/link'
import Image from 'next/image'
import { Camera, ImagePlus } from 'lucide-react'
import { StatusPill } from '@/components/ui/status-pill'
import { CarPlaceholder } from '@/components/ui/car-placeholder'
import { fmtPrice } from '@/lib/format'
import type { PickerVehicle } from '@/lib/social-data'
import type { VehicleStatus } from '@/lib/supabase/database.types'

/** Grid of cars to turn into an Instagram / WhatsApp post */
export function SocialPicker({
  vehicles,
  basePath,
  emptyHref,
}: {
  vehicles: PickerVehicle[]
  basePath: string
  emptyHref: string
}) {
  if (!vehicles.length) {
    return (
      <div className="bg-white rounded-[6px] px-6 py-14 text-center flex flex-col items-center gap-3" style={{ border: '0.5px solid var(--gray-line)' }}>
        <ImagePlus size={28} className="text-text-muted" />
        <p className="text-[14px] text-text-muted m-0">Primero publica un auto; después aquí haces su imagen para redes.</p>
        <Link href={emptyHref} className="inline-flex items-center h-10 px-5 rounded-[4px] bg-orange text-white text-[13px] font-[500]">
          Publicar auto
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
      {vehicles.map((v) => (
        <Link
          key={v.id}
          href={`${basePath}/${v.id}`}
          className="group bg-white rounded-[6px] overflow-hidden flex flex-col transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(1,37,56,0.35)]"
          style={{ border: '0.5px solid var(--gray-line)' }}
        >
          <div className="relative aspect-[4/3] bg-surface-alt overflow-hidden">
            {v.cover ? (
              <Image src={v.cover} alt={v.title} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
            ) : (
              <CarPlaceholder seed={v.id} className="w-full h-full" />
            )}
            <span className="absolute top-2 left-2"><StatusPill status={v.status as VehicleStatus} /></span>
            <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] bg-black/55 text-white text-[11px]">
              <Camera size={11} /> {v.photoCount}
            </span>
          </div>
          <div className="p-3 flex flex-col gap-1 flex-1">
            <div className="text-[13.5px] font-[500] leading-snug line-clamp-2">{v.title}</div>
            <div className="text-[12px] text-text-muted">
              {[v.year, v.price ? fmtPrice(v.price) : null].filter(Boolean).join(' · ')}
            </div>
            <span className="mt-auto pt-2 inline-flex items-center gap-1.5 text-[12px] font-[500] text-teal">
              <ImagePlus size={13} /> Crear post
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
