import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Acerca de LoteCUU — Autos usados en Chihuahua',
  description:
    'Conoce qué es LoteCUU, cómo funciona y cómo conectamos a compradores con vendedores de autos usados en Chihuahua.',
}

export default function AcercaPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section
        className="relative overflow-hidden px-5 py-12 md:px-10 md:py-20"
        style={{ background: '#1E232B', color: '#fff' }}
      >
        {/* Decorative lines */}
        <svg
          className="absolute top-0 right-0 w-[300px] h-full opacity-40 pointer-events-none hidden md:block"
          viewBox="0 0 300 320"
          preserveAspectRatio="none"
        >
          <g stroke="#E56A2E" strokeWidth="1" fill="none" opacity="0.3">
            <path d="M40 0 L100 320" />
            <path d="M140 0 L200 320" />
          </g>
          <g stroke="#255C7A" strokeWidth="1" fill="none" opacity="0.2">
            <path d="M240 0 L300 320" />
          </g>
        </svg>

        <div className="max-w-[760px] relative">
          <p className="text-[11px] font-[500] uppercase tracking-[0.12em] text-orange mb-3">
            Chihuahua · Plataforma de autos
          </p>
          <h1 className="text-[32px] md:text-[50px] font-[500] leading-[1.05] tracking-[-0.02em] m-0 mb-4">
            Acerca de{' '}
            <span className="text-orange">LoteCUU</span>
          </h1>
          <p className="text-[16px] md:text-[18px] text-white/65 leading-relaxed m-0 max-w-[560px]">
            La vitrina de autos usados más directa de Chihuahua. Sin formularios, sin intermediarios.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-[760px] mx-auto px-5 md:px-10 py-12 md:py-16 flex flex-col gap-12">

        {/* ¿Qué es? */}
        <section className="flex flex-col gap-4">
          <h2 className="text-[22px] md:text-[26px] font-[500] m-0 tracking-[-0.015em]">
            ¿Qué es LoteCUU?
          </h2>
          <p className="text-[15px] text-text-muted leading-relaxed m-0">
            LoteCUU es una plataforma digital diseñada para conectar a compradores y vendedores de autos usados en
            la ciudad de Chihuahua. Nació con una idea simple: que encontrar un auto de confianza no debería
            requerir llenar formularios largos ni esperar días para obtener una respuesta.
          </p>
          <p className="text-[15px] text-text-muted leading-relaxed m-0">
            Cada auto en LoteCUU pertenece a un lote o vendedor verificado que atiende directamente por WhatsApp.
            Tú ves el auto, haces clic y hablas de inmediato con quien lo vende. Sin más pasos.
          </p>
        </section>

        {/* Cómo funciona */}
        <section className="flex flex-col gap-6">
          <h2 className="text-[22px] md:text-[26px] font-[500] m-0 tracking-[-0.015em]">
            ¿Cómo funciona?
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                num: '01',
                title: 'Explora el catálogo',
                desc: 'Filtra por tipo de auto, transmisión, precio y más. Encuentra el que se ajusta a lo que buscas.',
              },
              {
                num: '02',
                title: 'Revisa la ficha',
                desc: 'Fotos reales, especificaciones completas, historial de propietario y estado de adeudo. Toda la info en un solo lugar.',
              },
              {
                num: '03',
                title: 'Contacta por WhatsApp',
                desc: 'Un clic te lleva directo al WhatsApp del vendedor. Sin formularios, sin espera, sin intermediarios.',
              },
            ].map((step) => (
              <div
                key={step.num}
                className="rounded-[14px] p-5 flex flex-col gap-3"
                style={{ border: '0.5px solid var(--gray-line)', background: '#fff' }}
              >
                <span
                  className="text-[11px] font-[500] uppercase tracking-[0.12em] text-orange"
                  style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}
                >
                  {step.num}
                </span>
                <h3 className="text-[15px] font-[500] m-0">{step.title}</h3>
                <p className="text-[13px] text-text-muted leading-relaxed m-0">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Para vendedores */}
        <section
          className="rounded-[16px] p-6 md:p-8 flex flex-col gap-4"
          style={{ border: '0.5px solid var(--gray-line)', background: '#fff' }}
        >
          <h2 className="text-[22px] font-[500] m-0 tracking-[-0.015em]">
            Para lotes y vendedores
          </h2>
          <p className="text-[15px] text-text-muted leading-relaxed m-0">
            Si tienes un lote de autos o vendes vehículos de forma individual, LoteCUU te da una vitrina
            profesional en Chihuahua. Publica tu inventario, agrega fotos, y recibe contactos directamente
            en tu WhatsApp. Sin comisiones por venta.
          </p>
          <div className="flex flex-wrap gap-3 mt-1">
            {['Inventario en línea', 'Fotos ilimitadas', 'Contacto por WhatsApp', 'Perfil de vendedor', 'Sin comisiones'].map((f) => (
              <span
                key={f}
                className="inline-flex items-center px-3 py-1.5 rounded-pill text-[12px] font-[500]"
                style={{ background: 'var(--surface-alt)', color: 'var(--text-base)', border: '0.5px solid var(--gray-line)' }}
              >
                {f}
              </span>
            ))}
          </div>
          <Link
            href="/publicar"
            className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 rounded-pill text-[14px] font-[500] bg-orange text-white hover:bg-orange-deep transition-colors self-start"
          >
            Publicar mis autos
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </section>

        {/* Contacto */}
        <section
          className="rounded-[16px] p-6 md:p-8 flex flex-col gap-4"
          style={{ background: '#1E232B', color: '#fff' }}
        >
          <h2 className="text-[22px] font-[500] m-0 tracking-[-0.015em]">
            Contacto
          </h2>
          <p className="text-[15px] text-white/60 leading-relaxed m-0">
            ¿Tienes preguntas, comentarios o quieres publicar en LoteCUU? Escríbenos directamente.
          </p>
          <div className="flex flex-col gap-3">
            <a
              href="https://wa.me/526141044597?text=Hola%2C%20me%20gustar%C3%ADa%20saber%20m%C3%A1s%20sobre%20LoteCUU"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-5 py-3 rounded-xl text-[14px] font-[500] text-white transition-opacity hover:opacity-90 self-start"
              style={{ background: '#25D366' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp · 614 104 4597
            </a>
            <a
              href="mailto:eduardolid20@gmail.com"
              className="inline-flex items-center gap-3 px-5 py-3 rounded-xl text-[14px] font-[500] text-white/70 hover:text-white transition-colors self-start"
              style={{ border: '0.5px solid rgba(255,255,255,0.15)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              eduardolid20@gmail.com
            </a>
          </div>
        </section>

      </div>
    </div>
  )
}
