'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { animate, createSpring, scrambleText, stagger, svg } from 'animejs'

export function Hero({ count }: { count: number }) {
  const [query, setQuery] = useState('')
  const router = useRouter()
  const textRef = useRef<HTMLDivElement>(null)
  const linesRef = useRef<SVGSVGElement>(null)
  const accentRef = useRef<HTMLSpanElement>(null)
  const countRef = useRef<HTMLSpanElement>(null)
  const dotRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // Text blocks slide up in sequence (translate only — never hides the H1/LCP)
    const blocks = textRef.current ? Array.from(textRef.current.children) : []
    const intro = blocks.length
      ? animate(blocks, {
          translateY: [22, 0],
          duration: 800,
          delay: stagger(90),
          ease: 'outExpo',
        })
      : null

    // Road lines draw themselves
    const paths = linesRef.current?.querySelectorAll('path')
    const draw = paths?.length
      ? animate(svg.createDrawable(paths), {
          draw: ['0 0', '0 1'],
          duration: 1600,
          delay: stagger(160),
          ease: 'inOutQuad',
        })
      : null

    // The city name decodes itself, like a departures board
    const accent = accentRef.current
      ? animate(accentRef.current, {
          innerHTML: scrambleText({ text: 'Chihuahua', chars: 'A-Z', cursor: '▍', revealDelay: 350 }),
        })
      : null

    // Live inventory counter rolls up from 0
    const counter = { n: 0 }
    const count = countRef.current
      ? animate(counter, {
          n: [0, Math.max(0, countRef.current.dataset.n ? Number(countRef.current.dataset.n) : 0)],
          duration: 1400,
          delay: 500,
          ease: 'outExpo',
          onUpdate: () => { if (countRef.current) countRef.current.textContent = String(Math.round(counter.n)) },
        })
      : null

    // Pulsing 'live' dot
    const pulse = dotRef.current
      ? animate(dotRef.current, { scale: [1, 1.9], opacity: [0.7, 0], duration: 1600, loop: true, ease: 'out(2)' })
      : null

    return () => {
      intro?.revert()
      draw?.revert()
      accent?.revert()
      count?.revert()
      pulse?.revert()
    }
  }, [])

  const handleSearch = () => {
    if (!query.trim()) return
    router.push(`/autos?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <section
      className="relative overflow-hidden px-5 py-8 md:px-10 md:py-14"
      style={{ background: '#012538', color: '#fff' }}
    >
      {/* Road-line decoration */}
      <svg
        ref={linesRef}
        className="absolute top-0 right-0 w-[360px] h-full opacity-60 pointer-events-none hidden md:block"
        viewBox="0 0 360 280"
        preserveAspectRatio="none"
      >
        <g stroke="#FB9833" strokeWidth="1" fill="none" opacity="0.35">
          <path d="M40 0 L100 280" />
          <path d="M120 0 L180 280" />
          <path d="M200 0 L260 280" />
        </g>
        <g stroke="#1B768E" strokeWidth="1" fill="none" opacity="0.25">
          <path d="M280 0 L340 280" />
        </g>
      </svg>

      <div ref={textRef} className="max-w-[920px] relative">
        <p className="text-[11px] font-[500] uppercase tracking-[0.12em] text-orange mb-3.5 md:mb-[18px]">
          Chihuahua · Autos usados
        </p>
        {count > 0 && (
          <div className="inline-flex items-center gap-2 mb-4 md:mb-5 px-3 py-1.5 rounded-pill text-[12px] font-[500] text-white/85" style={{ background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.14)' }}>
            <span className="relative flex w-2 h-2">
              <span ref={dotRef} className="absolute inset-0 rounded-full bg-orange" />
              <span className="relative w-2 h-2 rounded-full bg-orange" />
            </span>
            <span ref={countRef} data-n={count} className="tabular-nums">{count}</span>
            {count === 1 ? 'auto disponible ahora' : 'autos disponibles ahora'}
          </div>
        )}
        <h1 className="text-[32px] md:text-[52px] font-[500] leading-[1.05] tracking-[-0.02em] m-0 mb-5 md:mb-7">
          Encuentra tu próximo auto en{' '}
          <span ref={accentRef} className="text-orange">Chihuahua</span>
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
            <span className="text-white/80">contacto directo, sin intermediarios.</span>
          </p>
        </div>
      </div>
    </section>
  )
}
