import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ImagePlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { VehicleForm } from '@/components/admin/vehicle-form'
import { VehicleLedger } from '@/components/admin/vehicle-ledger'
import { VehicleDocuments } from '@/components/admin/vehicle-documents'

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
    <div className="p-4 md:p-8">
      <Link
        href="/admin/inventario"
        className="inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-base mb-6 transition-colors"
      >
        <ChevronLeft size={14} />
        Inventario
      </Link>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-8 max-w-3xl">
        <h1 className="text-[22px] md:text-[28px] font-[600] tracking-tight m-0 truncate min-w-0">
          {vehicle.title}
        </h1>
        <Link
          href={`/admin/inventario/${vehicle.id}/redes`}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-[4px] bg-white text-[13px] font-[500] hover:bg-surface-alt transition-colors shrink-0"
          style={{ border: '0.5px solid var(--gray-line-strong)' }}
        >
          <ImagePlus size={15} />
          Crear post para redes
        </Link>
      </div>
      <VehicleForm
        sellers={sellers ?? []}
        vehicle={vehicle}
        photos={photos ?? []}
      />
      <div className="flex flex-col gap-8 max-w-3xl mt-8">
        <VehicleLedger vehicleId={vehicle.id} listPrice={vehicle.price} status={vehicle.status} />
        <VehicleDocuments vehicleId={vehicle.id} />
      </div>
    </div>
  )
}
