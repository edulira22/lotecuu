import { createClient } from '@/lib/supabase/server'
import { AccountRow } from '@/components/admin/account-row'
import { NewAccountButton } from '@/components/admin/new-account-button'
import type { Seller } from '@/lib/supabase/database.types'

export const metadata = { title: 'Cuentas de vendedor — LoteCUU' }

export default async function CuentasPage() {
  const supabase = await createClient()
  const { data: sellersData } = await supabase
    .from('sellers')
    .select('*')
    .order('created_at', { ascending: false })

  const sellers = (sellersData ?? []) as unknown as Seller[]
  const withAccount = sellers.filter((s) => s.auth_user_id).length

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
        <h1 className="text-[28px] font-[600] tracking-tight">Cuentas de vendedor</h1>
        <NewAccountButton />
      </div>
      <p className="text-[13px] text-text-muted mb-8">
        Crea un usuario y contraseña — el vendedor entra en <strong>/login</strong> y llena su
        propio perfil (nombre, WhatsApp, fotos). {withAccount} de {sellers.length} vendedores
        tienen acceso.
      </p>

      {sellers.length > 0 && (
      <div className="bg-white rounded-[14px] overflow-hidden" style={{ border: '0.5px solid var(--gray-line)' }}>
        <div
          className="grid text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500] px-5 py-3"
          style={{ gridTemplateColumns: '1fr 140px 160px', background: 'var(--color-surface-alt)', borderBottom: '0.5px solid var(--gray-line)' }}
        >
          <span>Vendedor</span>
          <span>Acceso</span>
          <span />
        </div>

        {sellers.map((seller, i) => (
          <AccountRow key={seller.id} seller={seller} isFirst={i === 0} />
        ))}
      </div>
      )}
    </div>
  )
}
