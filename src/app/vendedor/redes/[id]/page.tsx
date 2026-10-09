import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Pencil } from 'lucide-react'
import { requireSeller } from '@/lib/supabase/current-seller'
import { loadStudioData } from '@/lib/social-data'
import { SocialPostStudio } from '@/components/admin/social-post-studio'

export const metadata = { title: 'Publicación para redes — LoteCUU' }

export default async function VendorRedesStudioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, seller } = await requireSeller()
  const data = await loadStudioData(supabase, id, seller.id)
  if (!data) notFound()

  return (
    <div className="p-4 md:p-8 max-w-6xl">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
        <Link href="/vendedor/redes" className="inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-base transition-colors">
          <ChevronLeft size={14} />
          Redes sociales
        </Link>
        <Link href={`/vendedor/inventario/${id}/editar`} className="inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-base transition-colors">
          <Pencil size={13} />
          Editar auto
        </Link>
      </div>
      <h1 className="text-[22px] md:text-[28px] font-[600] tracking-tight m-0">{data.vehicle.title}</h1>
      <p className="text-[13px] text-text-muted mt-1 mb-8">Publicación para Instagram, Facebook o estados de WhatsApp.</p>
      <SocialPostStudio {...data} />
    </div>
  )
}
