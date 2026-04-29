import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/ui/navbar'

export const metadata = { title: 'Vendedores en Chihuahua — LoteCUU' }

type SellerWithCount = {
  id: string
  name: string
  business_name: string | null
  slug: string
  whatsapp: string
  description: string | null
  address: string | null
}

export default async function VendedoresPage() {
  const supabase = await createClient()

  const { data: sellers } = await supabase
    .from('sellers')
    .select('id, name, business_name, slug, whatsapp, description, address')
    .eq('active', true)
    .order('name')

  const list = (sellers ?? []) as unknown as SellerWithCount[]

  // Get vehicle counts per seller
  const { data: counts } = await supabase
    .from('vehicles')
    .select('seller_id, status')
    .in('status', ['published', 'reserved'])

  const countMap: Record<string, number> = {}
  for (const row of (counts ?? []) as { seller_id: string; status: string }[]) {
    countMap[row.seller_id] = (countMap[row.seller_id] ?? 0) + 1
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      {/* Header */}
      <div className="px-5 md:px-10 py-8 md:py-12 border-b-hairline border-[var(--gray-line)]">
        <p className="text-[11px] font-[500] uppercase tracking-[0.12em] text-orange mb-2">
          Chihuahua · Vendedores
        </p>
        <h1 className="text-[32px] md:text-[44px] font-[500] tracking-[-0.02em] m-0">
          Lotes verificados
        </h1>
        <p className="text-[14px] text-text-muted mt-2">{list.length} vendedores activos</p>
      </div>

      {/* Grid */}
      <div className="px-5 md:px-10 py-8 pb-20">
        {list.length === 0 ? (
          <p className="text-text-muted text-[14px] text-center py-20">
            No hay vendedores registrados aún.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((s) => {
              const vehicleCount = countMap[s.id] ?? 0
              return (
                <Link
                  key={s.id}
                  href={`/vendedores/${s.slug}`}
                  className="block rounded-card border-hairline border-[var(--gray-line)] bg-white hover:border-[var(--gray-line-strong)] transition-colors overflow-hidden"
                >
                  {/* Color stripe */}
                  <div
                    className="h-1"
                    style={{ background: 'linear-gradient(90deg, #255C7A, #E56A2E)' }}
                  />
                  <div className="p-5 flex items-start gap-4">
                    {/* Initials plate */}
                    <div className="w-12 h-12 rounded-xl bg-surface-alt flex items-center justify-center shrink-0">
                      <span className="text-[18px] font-[600] text-teal tracking-tight">
                        {s.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <p className="text-[15px] font-[500] leading-tight truncate">
                        {s.business_name ?? s.name}
                      </p>
                      {s.address && (
                        <p className="text-[12px] text-text-muted flex items-center gap-1 truncate">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          {s.address}
                        </p>
                      )}
                      {vehicleCount > 0 && (
                        <p className="text-[12px] text-orange font-[500]">
                          {vehicleCount} auto{vehicleCount !== 1 ? 's' : ''} disponible{vehicleCount !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  {s.description && (
                    <p className="px-5 pb-4 text-[13px] text-text-muted leading-relaxed line-clamp-2">
                      {s.description}
                    </p>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer minimal */}
      <footer
        className="px-5 md:px-10 py-8 text-[12px] opacity-60"
        style={{ background: '#1E232B', color: 'rgba(255,255,255,0.7)', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}
      >
        © 2026 LoteCUU · Chihuahua, México
      </footer>
    </div>
  )
}
