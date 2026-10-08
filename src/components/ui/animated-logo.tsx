'use client'

import { useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { animate, createSpring, stagger } from 'animejs'
import {
  EMBLEM_DOT,
  EMBLEM_SLASHES,
  EMBLEM_TRIANGLE,
  LOGO_COLORS,
  LOGO_VIEWBOX,
  WORDMARK_LETTERS,
} from './logo-paths'

const SIZES = { sm: 24, md: 29, lg: 36 } as const
const RATIO = 10381.17 / 1361.73
const INTRO_KEY = 'lotecuu.logoIntro'
const SPRING = createSpring({ mass: 1, stiffness: 180, damping: 11 })

interface AnimatedLogoProps {
  variant?: 'light' | 'dark'
  size?: keyof typeof SIZES
  href?: string
  className?: string
}

/**
 * The real LoteCUU logo, inlined so each piece can move: the slashes "rev",
 * the dot hops and the letters ripple — once per visit, and on hover.
 * Nothing is hidden before the animation, so there is never a flash.
 */
export function AnimatedLogo({ variant = 'light', size = 'md', href = '/', className }: AnimatedLogoProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const busy = useRef(false)
  const h = SIZES[size]
  const textColor = variant === 'dark' ? LOGO_COLORS.light : LOGO_COLORS.navy

  const play = useCallback(() => {
    const svg = svgRef.current
    if (!svg || busy.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    busy.current = true
    const letters = svg.querySelectorAll('[data-letter]')
    const slashes = svg.querySelectorAll('[data-slash]')
    const dot = svg.querySelector('[data-dot]')
    const tri = svg.querySelector('[data-tri]')

    // Slashes pull back then shoot forward, like a gear change
    animate(slashes, {
      translateX: [
        { to: -160, duration: 160, ease: 'out(2)' },
        { to: 320, duration: 200, ease: 'in(2)' },
        { to: 0, ease: SPRING },
      ],
      delay: stagger(60),
    })
    // Dot hops out of the triangle and lands with a bounce
    if (dot) {
      animate(dot, {
        translateY: [{ to: -520, duration: 260, ease: 'out(3)' }, { to: 0, ease: SPRING }],
        scale: [{ to: 0.82, duration: 260 }, { to: 1, ease: SPRING }],
      })
    }
    if (tri) animate(tri, { skewX: [{ to: -6, duration: 180 }, { to: 0, ease: SPRING }] })
    // Letters ripple left to right
    animate(letters, {
      translateY: [{ to: -150, duration: 200, ease: 'out(3)' }, { to: 0, ease: SPRING }],
      delay: stagger(45, { start: 120 }),
      onComplete: () => { busy.current = false },
    })
  }, [])

  // Intro once per visit
  useEffect(() => {
    try {
      if (sessionStorage.getItem(INTRO_KEY)) return
      sessionStorage.setItem(INTRO_KEY, '1')
    } catch {}
    const t = window.setTimeout(play, 350)
    return () => window.clearTimeout(t)
  }, [play])

  const svg = (
    <svg
      ref={svgRef}
      viewBox={LOGO_VIEWBOX}
      width={Math.round(h * RATIO)}
      height={h}
      role="img"
      aria-label="LoteCUU"
      className="block overflow-visible"
    >
      <g style={{ transformBox: 'fill-box', transformOrigin: 'bottom left' }} data-tri>
        <path d={EMBLEM_TRIANGLE} fill={LOGO_COLORS.teal} />
      </g>
      {EMBLEM_SLASHES.map((d, i) => (
        <path key={i} d={d} fill={LOGO_COLORS.orange} data-slash />
      ))}
      <circle
        cx={EMBLEM_DOT.cx}
        cy={EMBLEM_DOT.cy}
        r={EMBLEM_DOT.r}
        fill={LOGO_COLORS.teal}
        data-dot
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      />
      {WORDMARK_LETTERS.map((d, i) => (
        <path key={i} d={d} fill={textColor} data-letter />
      ))}
    </svg>
  )

  return (
    <Link href={href} onPointerEnter={play} aria-label="LoteCUU — inicio" className={`inline-flex ${className ?? ''}`}>
      {svg}
    </Link>
  )
}
