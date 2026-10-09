import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Car, Mail, MessageCircle, Star } from 'lucide-react'
import { ACTIVE_STATUSES, requireSeller } from '@/lib/supabase/current-seller'
import { buildWhatsAppLink } from '@/lib/whatsapp'

export const metadata = { title: 'Mi plan — LoteCUU' }

const PLAN_LABEL: Record<string, string> = { basico: 'Básico', pro: 'Pro', premium: 'Premium' }
const PAYMENT: Record<string, { label: string; color: string; bg: string }> = {
  al_corriente: { label: 'Al corriente', color: '#3B6D11', bg: '#EAF3DE' },
  atrasado: { label: 'Pago pendiente', color: '#854F0B', bg: '#FAEEDA' },
  suspendido: { label: 'Suspendido', color: '#991b1b', bg: '#fef2f2' },
}
const ADMIN = { wa: '526141044597', email: 'eduardolid20@gmail.com' }

export default async function VendorPlanPage() {
  const { supabase, seller } = await requireSeller()

  const [{ count: active }, { count: featured }] = await Promise.all([
    supabase.from('vehicles').select('id', { count: 'exact', head: true }).eq('seller_id', seller.id).in('status', [...ACTIVE_STATUSES]),
    supabase.from('vehicles').select('id', { count: 'exact', head: true }).eq('seller_id', seller.id).eq('featured', true),
  ])
  const pay = PAYMENT[seller.payment_status] ?? PAYMENT.al_corriente
  const name = seller.business_name ?? seller.name
  const ask = `Hola, soy ${name} de LoteCUU. Me interesa ampliar mi plan (más autos o destacados).`

  const usage = [
    { icon: Car, label: 'Autos activos', used: active ?? 0, max: seller.max_vehicles, hint: 'Publicados, apartados, ocultos y borradores. Los vendidos no cuentan.' },
    { icon: Star, label: 'Autos destacados', used: featured ?? 0, max: seller.max_featured ?? 0, hint: 'Aparecen primero en el catálogo con la etiqueta «Destacado».' },
  ]

  return (
    <div className="p-4 md:p-8 max-w-3xl flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] md:text-[28px] font-[600] tracking-tight m-0">Mi plan</h1>
        <p className="text-[13px] text-text-muted mt-1 m-0">Lo que incluye tu cuenta y cuánto llevas usado.</p>
      </div>

      <section className="bg-white rounded-[6px] p-5 flex flex-col gap-5" style={{ border: '0.5px solid var(--gray-line)' }}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <span className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500]">Plan actual</span>
            <div className="text-[26px] font-[600] tracking-tight">{PLAN_LABEL[seller.plan] ?? seller.plan}</div>
            {seller.plan_expires_at && (
              <div className="text-[12.5px] text-text-muted">
                Vigente hasta el {format(new Date(seller.plan_expires_at), "d 'de' MMMM yyyy", { locale: es })}
              </div>
            )}
          </div>
          <span className="text-[12px] font-[500] px-2.5 py-1 rounded-[3px]" style={{ color: pay.color, background: pay.bg }}>{pay.label}</span>
        </div>

        {usage.map(({ icon: Icon, label, used, max, hint }) => {
          const pct = max ? Math.min(100, (used / max) * 100) : 100
          const full = used >= max
          return (
            <div key={label} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-[14px] font-[500]"><Icon size={15} className="text-text-muted" /> {label}</span>
                <span className="text-[13px] tabular-nums"><strong className={full ? 'text-red-600' : ''}>{used}</strong> de {max}</span>
              </div>
              <div className="h-2 rounded-full bg-surface-alt overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: full ? '#ef4444' : 'var(--color-orange)' }} />
              </div>
              <span className="text-[12px] text-text-muted">{hint}</span>
            </div>
          )
        })}
      </section>

      <section className="bg-white rounded-[6px] p-5 flex flex-col gap-3" style={{ border: '0.5px solid var(--gray-line)' }}>
        <h2 className="text-[15px] font-[600] m-0">¿Necesitas más espacio?</h2>
        <p className="text-[13px] text-text-muted m-0">Escríbenos y ajustamos tu plan: más autos, más destacados o ambos.</p>
        <div className="flex gap-2.5 flex-wrap">
          <a
            href={buildWhatsAppLink(ADMIN.wa, ask)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-[4px] text-white text-[13px] font-[500]"
            style={{ background: '#25D366' }}
          >
            <MessageCircle size={15} /> WhatsApp
          </a>
          <a
            href={`mailto:${ADMIN.email}?subject=${encodeURIComponent('Ampliar mi plan — LoteCUU')}&body=${encodeURIComponent(ask)}`}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-[4px] bg-white text-[13px] font-[500]"
            style={{ border: '0.5px solid var(--gray-line-strong)' }}
          >
            <Mail size={15} /> Correo
          </a>
        </div>
      </section>
    </div>
  )
}
