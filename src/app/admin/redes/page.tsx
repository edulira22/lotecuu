import { createClient } from '@/lib/supabase/server'
import { loadPickerVehicles } from '@/lib/social-data'
import { SocialPicker } from '@/components/social/social-picker'

export const metadata = { title: 'Redes sociales' }

export default async function AdminRedesPage() {
  const supabase = await createClient()
  const vehicles = await loadPickerVehicles(supabase)
  return (
    <div className="p-4 md:p-8 max-w-6xl">
      <h1 className="text-[22px] md:text-[28px] font-[600] tracking-tight m-0">Redes sociales</h1>
      <p className="text-[13px] text-text-muted mt-1 mb-6">
        Elige un auto para crear su imagen para Instagram, Facebook o estados de WhatsApp.
      </p>
      <SocialPicker vehicles={vehicles} basePath="/admin/redes" emptyHref="/admin/inventario/nuevo" />
    </div>
  )
}
