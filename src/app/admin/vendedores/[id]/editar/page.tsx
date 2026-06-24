import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, KeyRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SellerForm } from '@/components/admin/seller-form'

export const metadata = { title: 'Editar vendedor' }

export default async function EditarVendedorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: seller } = await supabase
    .from('sellers')
    .select('*')
    .eq('id', id)
    .single()

  if (!seller) notFound()

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <Link
          href="/admin/vendedores"
          className="inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-base transition-colors"
        >
          <ChevronLeft size={14} />
          Vendedores
        </Link>
        <Link
          href={`/admin/vendedores/${id}/cuenta`}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-pill text-[13px] font-[500] transition-colors"
          style={{ border: '0.5px solid var(--gray-line-strong)', color: seller.auth_user_id ? 'var(--color-teal)' : 'var(--text-muted)' }}
        >
          <KeyRound size={13} />
          {seller.auth_user_id ? 'Tiene acceso' : 'Crear acceso'}
        </Link>
      </div>
      <h1 className="text-[28px] font-[600] tracking-tight mb-8">
        Editar: {seller.name}
      </h1>
      <SellerForm seller={seller} />
    </div>
  )
}
