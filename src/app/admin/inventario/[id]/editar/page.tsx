import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { VehicleForm } from '@/components/admin/vehicle-form'

export const metadata = { title: 'Editar vehículo' }

export default async function EditarVehiculoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: vehicle }, { data: sellers }, { data: photos }] = await Promise.all([
    supabase.from('vehicles').select('*').eq('id', id).single(),
    supabase.from('sellers').select('*').eq('active', true).order('name'),
    supabase
      .from('vehicle_photos')
      .select('*')
      .eq('vehicle_id', id)
      .order('sort_order'),
  ])

  if (!vehicle) notFound()

  return (
    <div className="p-8">
      <Link
        href="/admin/inventario"
        className="inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-base mb-6 transition-colors"
      >
        <ChevronLeft size={14} />
        Inventario
      </Link>
      <h1 className="text-[28px] font-[600] tracking-tight mb-8 truncate">
        {vehicle.title}
      </h1>
      <VehicleForm
        sellers={sellers ?? []}
        vehicle={vehicle}
        photos={photos ?? []}
      />
    </div>
  )
}
