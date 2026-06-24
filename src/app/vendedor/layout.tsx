import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { VendorSidebar } from '@/components/vendor/sidebar'
import type { Seller } from '@/lib/supabase/database.types'

export default async function VendedorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: sellerData } = await supabase
    .from('sellers')
    .select('*')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (!sellerData) redirect('/admin/inventario')

  const seller = sellerData as unknown as Seller

  if (seller.payment_status === 'suspendido') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-6">
        <div className="max-w-sm text-center flex flex-col gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
          </div>
          <h1 className="text-[20px] font-[600]">Cuenta suspendida</h1>
          <p className="text-[14px] text-text-muted leading-relaxed">
            Tu cuenta ha sido suspendida temporalmente. Comunícate con el administrador de LoteCUU para más información.
          </p>
          <a
            href="https://wa.me/526141044597"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-[500] text-white"
            style={{ background: '#25D366' }}
          >
            Contactar soporte
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#F4F2EC' }}>
      <VendorSidebar seller={seller} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
