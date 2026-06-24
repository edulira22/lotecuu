import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AccountManager } from '@/components/admin/account-manager'

export const metadata = { title: 'Cuenta de vendedor' }

export default async function CuentaVendedorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: seller } = await supabase.from('sellers').select('*').eq('id', id).single()
  if (!seller) notFound()

  return (
    <div className="p-8 max-w-xl">
      <Link href={`/admin/vendedores/${id}/editar`} className="inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-base mb-6 transition-colors">
        <ChevronLeft size={14} />
        {seller.name}
      </Link>
      <h1 className="text-[28px] font-[600] tracking-tight mb-2">Cuenta de acceso</h1>
      <p className="text-[13px] text-text-muted mb-8">
        Crea un usuario y contraseña para que <strong>{seller.name}</strong> pueda acceder al portal y gestionar sus propios vehículos.
      </p>
      <AccountManager seller={seller} />
    </div>
  )
}
