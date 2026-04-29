import Link from 'next/link'
import { Navbar } from '@/components/ui/navbar'

export const metadata = {
  title: 'Publica tu auto en LoteCUU · Chihuahua',
}

const STEPS = [
  {
    n: '01',
    title: 'Regístrate como vendedor',
    body: 'Crea tu perfil de lote con datos de contacto, logo y descripción.',
  },
  {
    n: '02',
    title: 'Sube tus autos',
    body: 'Fotos, precio, km, año y todos los detalles desde tu panel de administración.',
  },
  {
    n: '03',
    title: 'Recibe contactos directos',
    body: 'Los compradores te escriben por WhatsApp directamente, sin formularios ni intermediarios.',
  },
]

const BENEFITS = [
  { icon: '⚡', title: 'Rápido', body: 'Publica en minutos desde cualquier dispositivo.' },
  { icon: '🔗', title: 'Directo', body: 'WhatsApp directo al comprador, sin filtros.' },
  { icon: '📍', title: 'Local', body: 'Plataforma 100% enfocada en Chihuahua.' },
  { icon: '✓', title: 'Verificado', body: 'Tu perfil muestra el badge de vendedor verificado.' },
]

export default function PublicarPage() {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      {/* Hero */}
      <section
        className="px-5 md:px-10 py-12 md:py-20 relative overflow-hidden"
        style={{ background: '#1E232B', color: '#fff' }}
      >
        <svg
          className="absolute top-0 right-0 w-[360px] h-full opacity-40 pointer-events-none hidden md:block"
          viewBox="0 0 360 280"
          preserveAspectRatio="none"
        >
          <g stroke="#E56A2E" strokeWidth="1" fill="none" opacity="0.35">
            <path d="M40 0 L100 280" /><path d="M120 0 L180 280" /><path d="M200 0 L260 280" />
          </g>
        </svg>
        <div className="max-w-[720px] relative">
          <p className="text-[11px] font-[500] uppercase tracking-[0.12em] text-orange mb-3">
            Para vendedores
          </p>
          <h1 className="text-[36px] md:text-[54px] font-[500] leading-[1.05] tracking-[-0.02em] m-0 mb-5">
            Llega a compradores en{' '}
            <span className="text-orange">Chihuahua</span>
          </h1>
          <p className="text-[16px] md:text-[18px] text-white/80 m-0 mb-8 max-w-[520px] leading-relaxed">
            LoteCUU conecta tu inventario con compradores locales vía WhatsApp directo. Sin comisiones, sin formularios.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-[15px] font-[500] bg-orange text-white hover:bg-orange-deep transition-colors"
            >
              Publicar mi inventario
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/autos"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-[15px] font-[500] border border-white/20 text-white hover:bg-white/10 transition-colors"
            >
              Ver el feed
            </Link>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="px-5 md:px-10 py-12 md:py-16">
        <p className="text-[11px] font-[500] uppercase tracking-[0.12em] text-text-muted mb-6 md:mb-8">
          Cómo funciona
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {STEPS.map((s) => (
            <div key={s.n} className="flex flex-col gap-3">
              <span
                className="text-[11px] font-[600] tracking-[0.1em]"
                style={{ fontFamily: 'ui-monospace, Menlo, monospace', color: '#E56A2E' }}
              >
                {s.n}
              </span>
              <h3 className="text-[18px] font-[500] m-0 leading-snug">{s.title}</h3>
              <p className="text-[14px] text-text-muted leading-relaxed m-0">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section
        className="px-5 md:px-10 py-10 md:py-14"
        style={{ borderTop: '0.5px solid var(--gray-line)' }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="rounded-xl border-hairline border-[var(--gray-line)] bg-white p-5 flex flex-col gap-2"
            >
              <span className="text-[24px]">{b.icon}</span>
              <p className="text-[15px] font-[500] m-0">{b.title}</p>
              <p className="text-[13px] text-text-muted leading-relaxed m-0">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA footer */}
      <section
        className="px-5 md:px-10 py-12 md:py-16 text-center"
        style={{ background: '#1E232B', color: '#fff' }}
      >
        <h2 className="text-[28px] md:text-[36px] font-[500] tracking-[-0.02em] m-0 mb-4">
          ¿Listo para publicar?
        </h2>
        <p className="text-[15px] text-white/70 m-0 mb-7">
          Crea tu cuenta de vendedor y empieza hoy.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-[15px] font-[500] bg-orange text-white hover:bg-orange-deep transition-colors"
        >
          Crear cuenta de vendedor
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </section>

      <footer
        className="px-5 md:px-10 py-6 text-[12px]"
        style={{
          background: '#1E232B',
          color: 'rgba(255,255,255,0.5)',
          borderTop: '0.5px solid rgba(255,255,255,0.08)',
        }}
      >
        © 2026 LoteCUU · Chihuahua, México
      </footer>
    </div>
  )
}
