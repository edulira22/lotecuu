import { requireSeller } from '@/lib/supabase/current-seller'
import { loadPickerVehicles } from '@/lib/social-data'
import { SocialPicker } from '@/components/social/social-picker'

export const metadata = { title: 'Redes sociales — LoteCUU' }

export default async function VendorRedesPage() {
  const { supabase, seller } = await requireSeller()
  const vehicles = await loadPickerVehicles(supabase, seller.id)
  return (
    <div className="p-4 md:p-8 max-w-6xl">
      <h1 className="text-[22px] md:text-[28px] font-[600] tracking-tight m-0">Redes sociales</h1>
      <p className="text-[13px] text-text-muted mt-1 mb-6">
        Elige un auto y crea su imagen para Instagram, Facebook o tu estado de WhatsApp, con tu logo y el de LoteCUU.
      </p>
      <SocialPicker vehicles={vehicles} basePath="/vendedor/redes" emptyHref="/vendedor/inventario/nuevo" />
    </div>
  )
}
