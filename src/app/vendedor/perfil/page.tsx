import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SellerForm } from '@/components/admin/seller-form'
import type { Seller } from '@/lib/supabase/database.types'

export const metadata = { title: 'Mi perfil — LoteCUU' }

export default async function VendorPerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sellerData } = await supabase
    .from('sellers').select('*').eq('auth_user_id', user.id).maybeSingle()
  if (!sellerData) redirect('/login')

  return (
    <div className="p-8">
      <h1 className="text-[28px] font-[600] tracking-tight mb-2">Mi perfil</h1>
      <p className="text-[13px] text-text-muted mb-8">
        Información visible en tu página pública de vendedor.
      </p>
      <SellerForm seller={sellerData as unknown as Seller} backHref="/vendedor/perfil" />
    </div>
  )
}
