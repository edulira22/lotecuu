import { ChevronDown, FileText, Lock } from 'lucide-react'
import { requireSeller } from '@/lib/supabase/current-seller'
import { StatusPill } from '@/components/ui/status-pill'
import { VehicleDocuments } from '@/components/admin/vehicle-documents'
import type { VehicleStatus } from '@/lib/supabase/database.types'

export const metadata = { title: 'Documentos — LoteCUU' }

export default async function VendorDocumentosPage() {
  const { supabase, seller } = await requireSeller()

  const { data } = await supabase
    .from('vehicles')
    .select('id, title, status, year')
    .eq('seller_id', seller.id)
    .order('created_at', { ascending: false })
  const cars = (data ?? []) as { id: string; title: string; status: VehicleStatus; year: number | null }[]

  const docsRes = cars.length
    ? await supabase.from('vehicle_documents').select('vehicle_id').in('vehicle_id', cars.map((c) => c.id))
    : { data: [], error: null }
  const count = new Map<string, number>()
  for (const d of (docsRes.data ?? []) as { vehicle_id: string }[]) count.set(d.vehicle_id, (count.get(d.vehicle_id) ?? 0) + 1)
  const total = [...count.values()].reduce((a, b) => a + b, 0)
  // Cars with papers first
  const sorted = [...cars].sort((a, b) => (count.get(b.id) ?? 0) - (count.get(a.id) ?? 0))

  return (
    <div className="p-4 md:p-8 max-w-4xl flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] md:text-[28px] font-[600] tracking-tight m-0">Documentos</h1>
        <p className="text-[13px] text-text-muted mt-1 m-0 flex items-center gap-1.5 flex-wrap">
          <Lock size={13} /> Privados: solo tú y la administración. Seguros, contratos, facturas, tenencias…
          {total > 0 && <span>· {total} en total</span>}
        </p>
      </div>

      {docsRes.error && (
        <p className="text-[12.5px] text-text-muted m-0">Los documentos se activan cuando la administración corra la migración 006 en Supabase.</p>
      )}

      {cars.length === 0 ? (
        <p className="bg-white rounded-[6px] px-5 py-10 text-center text-[13.5px] text-text-muted m-0" style={{ border: '0.5px solid var(--gray-line)' }}>
          Cuando registres autos podrás guardar aquí sus papeles.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {sorted.map((c) => {
            const n = count.get(c.id) ?? 0
            return (
              <details key={c.id} className="group bg-white rounded-[6px] overflow-hidden" style={{ border: '0.5px solid var(--gray-line)' }}>
                <summary className="flex items-center gap-3 px-4 md:px-5 py-3.5 cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-surface transition-colors">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-[500] truncate">{c.title}</span>
                    <span className="flex items-center gap-2 mt-1">
                      <StatusPill status={c.status} />
                      <span className="text-[12px] text-text-muted inline-flex items-center gap-1">
                        <FileText size={12} /> {n} {n === 1 ? 'documento' : 'documentos'}
                      </span>
                    </span>
                  </span>
                  <ChevronDown size={16} className="text-text-muted shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-3 md:px-4 pb-4 pt-4" style={{ borderTop: '0.5px solid var(--gray-line)' }}>
                  <VehicleDocuments vehicleId={c.id} />
                </div>
              </details>
            )
          })}
        </div>
      )}
    </div>
  )
}
