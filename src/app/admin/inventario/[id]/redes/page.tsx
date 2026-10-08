import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { sortPhotos } from '@/lib/photo-angles'
import { SocialPostStudio } from '@/components/admin/social-post-studio'

export const metadata = { title: 'Publicación para redes' }

export default async function RedesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: v } = await supabase
    .from('vehicles')
    .select(`
      id, title, slug, brand, model, version, year, mileage, transmission, fuel, body_type,
      price, negotiable, financing, status,
      seller:sellers(name, business_name, logo_url, profile_photo_url, whatsapp, phone),
      photos:vehicle_photos(url, is_cover, sort_order, angle)
    `)
    .eq('id', id)
    .single()

  if (!v) notFound()

  const seller = v.seller as unknown as {
    name: string; business_name: string | null; logo_url: string | null
    profile_photo_url: string | null; whatsapp: string | null; phone: string | null
  } | null
  const photos = sortPhotos((v.photos ?? []) as { url: string; is_cover: boolean; sort_order: number; angle: string | null }[])

  return (
    <div className="p-4 md:p-8 max-w-6xl">
      <Link
        href={`/admin/inventario/${v.id}/editar`}
        className="inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-base mb-6 transition-colors"
      >
        <ChevronLeft size={14} />
        {v.title}
      </Link>
      <h1 className="text-[22px] md:text-[28px] font-[600] tracking-tight m-0">Publicación para redes</h1>
      <p className="text-[13px] text-text-muted mt-1 mb-8">
        Genera la imagen para Instagram, Facebook o estados de WhatsApp con los datos del auto.
      </p>
      <SocialPostStudio
        vehicle={{
          title: v.title, version: v.version, year: v.year, mileage: v.mileage, transmission: v.transmission,
          fuel: v.fuel, body_type: v.body_type, price: v.price, negotiable: v.negotiable,
          financing: v.financing, status: v.status,
        }}
        brand={v.brand}
        model={v.model}
        slug={v.slug}
        photos={photos.map((p) => p.url)}
        seller={seller ? { ...seller, name: seller.business_name ?? seller.name } : null}
      />
    </div>
  )
}
