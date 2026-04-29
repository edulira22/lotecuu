import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
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
      <Link
        href="/admin/vendedores"
        className="inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-base mb-6 transition-colors"
      >
        <ChevronLeft size={14} />
        Vendedores
      </Link>
      <h1 className="text-[28px] font-[600] tracking-tight mb-8">
        Editar: {seller.name}
      </h1>
      <SellerForm seller={seller} />
    </div>
  )
}
