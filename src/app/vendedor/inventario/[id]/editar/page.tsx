import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { VehicleForm } from '@/components/admin/vehicle-form'
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

  const { data: vehicle } = await supabase
    .from('vehicles').select('*').eq('id', id).eq('seller_id', seller.id).single()
  if (!vehicle) notFound()

  const { data: photos } = await supabase
    .from('vehicle_photos').select('*').eq('vehicle_id', id).order('sort_order')

  return (
    <div className="p-8">
      <Link href="/vendedor/inventario" className="inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-base mb-6 transition-colors">
        <ChevronLeft size={14} />
        Mis autos
      </Link>
      <h1 className="text-[28px] font-[600] tracking-tight mb-8">Editar: {vehicle.title}</h1>
      <VehicleForm
        sellers={[seller]}
        vehicle={vehicle as unknown as Vehicle}
        photos={(photos ?? []) as unknown as VehiclePhoto[]}
        lockedSellerId={seller.id}
        backHref="/vendedor/inventario"
      />
    </div>
  )
}
