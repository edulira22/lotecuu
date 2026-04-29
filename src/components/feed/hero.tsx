'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/ui/logo'

export function Hero({ count }: { count: number }) {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSearch = () => {
    if (!query.trim()) return
    router.push(`/autos?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <section
      className="relative overflow-hidden px-5 py-8 md:px-10 md:py-14"
      style={{ background: '#1E232B', color: '#fff' }}
    >
      {/* Road-line decoration */}
      <svg
        className="absolute top-0 right-0 w-[360px] h-full opacity-60 pointer-events-none hidden md:block"
        viewBox="0 0 360 280"
        preserveAspectRatio="none"
      >
        <g stroke="#E56A2E" strokeWidth="1" fill="none" opacity="0.35">
          <path d="M40 0 L100 280" />
          <path d="M120 0 L180 280" />
          <path d="M200 0 L260 280" />
        </g>
        <g stroke="#255C7A" strokeWidth="1" fill="none" opacity="0.25">
          <path d="M280 0 L340 280" />
        </g>
      </svg>

      <div className="max-w-[920px] relative">
        <p className="text-[11px] font-[500] uppercase tracking-[0.12em] text-orange mb-3.5 md:mb-[18px]">
          Chihuahua · Autos usados
        </p>
        <h1 className="text-[32px] md:text-[52px] font-[500] leading-[1.05] tracking-[-0.02em] m-0 mb-5 md:mb-7">
          Encuentra tu próximo auto en{' '}
          <span className="text-orange">Chihuahua</span>
        </h1>

        <div
          className="flex gap-0 p-1.5 max-w-full md:max-w-[560px]"
          style={{
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 999,
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="flex items-center gap-2.5 px-4 flex-1 min-w-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Busca marca, modelo o año..."
              className="flex-1 min-w-0 border-none bg-transparent text-white outline-none text-[14px] font-[400] py-3 placeholder:text-white/50"
              style={{ fontFamily: 'var(--font-sans)' }}
            />
          </div>
          <button
            onClick={handleSearch}
            className="shrink-0 px-5 py-2.5 md:px-6 rounded-pill text-[14px] font-[500] bg-orange text-white hover:bg-orange-deep transition-colors"
          >
            Buscar
          </button>
        </div>

        <div className="hidden md:flex items-center gap-5 mt-8">
          <p className="text-[13px] text-white/55 font-[400] leading-relaxed">
            Conectamos compradores y vendedores en Chihuahua —{' '}
            <span className="text-white/80">sin intermediarios, directo por WhatsApp.</span>
          </p>
        </div>
      </div>
    </section>
  )
}
