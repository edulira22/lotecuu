import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { VehicleForm } from '@/components/admin/vehicle-form'
import type { Seller } from '@/lib/supabase/database.types'

export const metadata = { title: 'Agregar auto — LoteCUU' }

export default async function VendorNuevoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sellerData } = await supabase
    .from('sellers').select('*').eq('auth_user_id', user.id).maybeSingle()
  if (!sellerData) redirect('/login')
  const seller = sellerData as unknown as Seller

  // Check plan limit
  const { count } = await supabase
    .from('vehicles')
    .select('id', { count: 'exact', head: true })
    .eq('seller_id', seller.id)
    .in('status', ['published', 'reserved', 'hidden', 'draft'])

  if ((count ?? 0) >= seller.max_vehicles) redirect('/vendedor/inventario')

  return (
    <div className="p-8">
      <Link href="/vendedor/inventario" className="inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-base mb-6 transition-colors">
        <ChevronLeft size={14} />
        Mis autos
      </Link>
      <h1 className="text-[28px] font-[600] tracking-tight mb-8">Agregar auto</h1>
      <VehicleForm sellers={[seller]} lockedSellerId={seller.id} backHref="/vendedor/inventario" />
    </div>
  )
}
