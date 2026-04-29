import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { VehicleForm } from '@/components/admin/vehicle-form'

export const metadata = { title: 'Nuevo vehículo' }

export default async function NuevoVehiculoPage() {
  const supabase = await createClient()
  const { data: sellers } = await supabase
    .from('sellers')
    .select('*')
    .eq('active', true)
    .order('name')

  return (
    <div className="p-8">
      <Link
        href="/admin/inventario"
        className="inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-base mb-6 transition-colors"
      >
        <ChevronLeft size={14} />
        Inventario
      </Link>
      <h1 className="text-[28px] font-[600] tracking-tight mb-8">Publicar vehículo</h1>
      <VehicleForm sellers={sellers ?? []} />
    </div>
  )
}
