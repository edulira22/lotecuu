import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { SellerForm } from '@/components/admin/seller-form'

export const metadata = { title: 'Nuevo vendedor' }

export default function NuevoVendedorPage() {
  return (
    <div className="p-8">
      <Link
        href="/admin/vendedores"
        className="inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-base mb-6 transition-colors"
      >
        <ChevronLeft size={14} />
        Vendedores
      </Link>
      <h1 className="text-[28px] font-[600] tracking-tight mb-8">Nuevo vendedor</h1>
      <SellerForm />
    </div>
  )
}
