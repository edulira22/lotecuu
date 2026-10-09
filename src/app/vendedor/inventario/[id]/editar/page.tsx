import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ImagePlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { VehicleForm } from '@/components/admin/vehicle-form'
import { VehicleLedger } from '@/components/admin/vehicle-ledger'
import { VehicleDocuments } from '@/components/admin/vehicle-documents'
import type { Seller, Vehicle, VehiclePhoto } from '@/lib/supabase/database.types'

export const metadata = { title: 'Editar auto — LoteCUU' }

export default async function VendorEditarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sellerData } = await supabase
    .from('sellers').select('*').eq('auth_user_id', user.id).maybeSingle()
  if (!sellerData) redirect('/login')
  const seller = sellerData as unknown as Seller

  const { data: vehicleData } = await supabase
    .from('vehicles').select('*').eq('id', id).eq('seller_id', seller.id).single()
  if (!vehicleData) notFound()
  const vehicle = vehicleData as unknown as Vehicle

  const [{ data: photos }, { count: featuredUsed }] = await Promise.all([
    supabase.from('vehicle_photos').select('*').eq('vehicle_id', id).order('sort_order'),
    supabase
      .from('vehicles')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', seller.id)
      .eq('featured', true)
      .neq('id', id),
  ])

  return (
    <div className="p-4 md:p-8 flex flex-col gap-8 max-w-3xl">
      <div>
        <Link href="/vendedor/inventario" className="inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-base mb-6 transition-colors">
          <ChevronLeft size={14} />
          Mis autos
        </Link>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <h1 className="text-[22px] md:text-[28px] font-[600] tracking-tight m-0 min-w-0">Editar: {vehicle.title}</h1>
          <Link
            href={`/vendedor/redes/${vehicle.id}`}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-[4px] bg-white text-[13px] font-[500] hover:bg-surface-alt transition-colors shrink-0"
            style={{ border: '0.5px solid var(--gray-line-strong)' }}
          >
            <ImagePlus size={15} />
            Crear post para redes
          </Link>
        </div>
      </div>
      <VehicleForm
        sellers={[seller]}
        vehicle={vehicle}
        photos={(photos ?? []) as unknown as VehiclePhoto[]}
        lockedSellerId={seller.id}
        backHref="/vendedor/inventario"
        featuredLimit={{ max: seller.max_featured ?? 0, used: featuredUsed ?? 0 }}
      />
      <VehicleLedger vehicleId={vehicle.id} listPrice={vehicle.price} status={vehicle.status} />
      <VehicleDocuments vehicleId={vehicle.id} />
    </div>
  )
}
