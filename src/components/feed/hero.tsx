'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { animate, createSpring, splitText, stagger, svg } from 'animejs'
import { HeroEmblem } from './hero-emblem'

export function Hero({ count }: { count: number }) {
  const [query, setQuery] = useState('')
  const router = useRouter()
  const textRef = useRef<HTMLDivElement>(null)
  const accentRef = useRef<HTMLSpanElement>(null)
  const underlineRef = useRef<SVGPathElement>(null)
  const countRef = useRef<HTMLSpanElement>(null)
  const dotRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (underlineRef.current) underlineRef.current.style.opacity = '1'
      return
    }

    // Text blocks slide up in sequence (translate only — never hides the H1/LCP)
    const blocks = textRef.current ? Array.from(textRef.current.children) : []
    const intro = blocks.length
      ? animate(blocks, { translateY: [22, 0], duration: 800, delay: stagger(90), ease: 'outExpo' })
      : null

    // "Chihuahua": letters spring up out of a mask, one after another…
    const split = accentRef.current ? splitText(accentRef.current, { chars: { wrap: 'clip' } }) : null
    const letters = split
      ? animate(split.chars, {
          y: ['105%', '0%'],
          rotate: [8, 0],
          delay: stagger(55, { start: 380 }),
          ease: createSpring({ mass: 1, stiffness: 140, damping: 13 }),
        })
      : null

    // …then an orange speed stroke draws itself underneath
    let underline: ReturnType<typeof animate> | null = null
    if (underlineRef.current) {
      underlineRef.current.style.opacity = '1'
      underline = animate(svg.createDrawable(underlineRef.current), {
        draw: ['0 0', '0 1'],
        delay: 900,
        duration: 900,
        ease: 'inOut(3)',
      })
    }

    // Live inventory counter rolls up from 0
    const counter = { n: 0 }
    const target = Number(countRef.current?.dataset.n ?? 0)
    const count = countRef.current
      ? animate(counter, {
          n: [0, target],
          duration: 1400,
          delay: 500,
          ease: 'outExpo',
          onUpdate: () => { if (countRef.current) countRef.current.textContent = String(Math.round(counter.n)) },
        })
      : null

    // Pulsing 'live' dot
    const pulse = dotRef.current
      ? animate(dotRef.current, { scale: [1, 2.2], opacity: [0.7, 0], duration: 1600, loop: true, ease: 'out(2)' })
      : null

    return () => {
      intro?.revert()
      letters?.revert()
      split?.revert()
      underline?.revert()
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
      {/* Interactive logo emblem (wide screens) */}
      <HeroEmblem className="hidden xl:block absolute right-[7%] top-1/2 -translate-y-1/2 w-[30%] max-w-[460px] pointer-events-none" />

      <div ref={textRef} className="max-w-[920px] relative">
        <p className="text-[11px] font-[500] uppercase tracking-[0.12em] text-orange mb-3.5 md:mb-[18px]">
          Chihuahua · Autos usados
        </p>
        {count > 0 && (
          <div
            className="inline-flex items-center gap-2 mb-4 md:mb-5 px-3 py-1.5 rounded-[4px] text-[12px] font-[500] text-white/85"
            style={{ background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.14)' }}
          >
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
          <span className="relative inline-block text-orange">
            <span ref={accentRef}>Chihuahua</span>
            <svg
              aria-hidden
              viewBox="0 0 300 16"
              preserveAspectRatio="none"
              className="absolute left-0 -bottom-[0.14em] w-full h-[0.22em] overflow-visible"
            >
              <path
                ref={underlineRef}
                d="M2 12 L248 4 M262 9 L298 7"
                fill="none"
                stroke="#FB9833"
                strokeWidth="3.5"
                strokeLinecap="square"
                vectorEffect="non-scaling-stroke"
                style={{ opacity: 0 }}
              />
            </svg>
          </span>
        </h1>

        <div
          className="flex gap-0 p-1.5 max-w-full md:max-w-[560px]"
          style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 6, backdropFilter: 'blur(8px)' }}
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
            className="shrink-0 px-5 py-2.5 md:px-6 rounded-[4px] text-[14px] font-[500] bg-orange text-white hover:bg-orange-deep transition-colors"
          >
            Buscar
          </button>
        </div>

        <div className="hidden md:flex items-center gap-5 mt-8">
          <p className="text-[13px] text-white/55 font-[400] leading-relaxed">
            El catálogo de autos usados de Chihuahua, con el contacto directo de cada vendedor.
          </p>
        </div>
      </div>
    </section>
  )
}
