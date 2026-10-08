'use client'

import { useEffect, useRef } from 'react'
import { animate, createAnimatable, createSpring, stagger, svg } from 'animejs'
import type { AnimatableObject } from 'animejs'
import { EMBLEM_DOT, EMBLEM_SLASHES, EMBLEM_TRIANGLE, EMBLEM_VIEWBOX, LOGO_COLORS } from '@/components/ui/logo-paths'

/**
 * Large interactive version of the logo emblem for the hero:
 * the teal leg draws itself and fills, the orange slashes speed in, the dot
 * drops and bounces — then every layer follows the pointer at its own depth.
 */
export function HeroEmblem({ className }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const root = svgRef.current
    if (!root) return
    const tri = root.querySelector<SVGPathElement>('[data-tri]')
    const slashes = root.querySelectorAll<SVGPathElement>('[data-slash]')
    const dot = root.querySelector<SVGCircleElement>('[data-dot]')
    const show = () => {
      tri?.setAttribute('fill-opacity', '1')
      slashes.forEach((s) => (s.style.opacity = '1'))
      if (dot) dot.style.opacity = '1'
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { show(); return }

    // ── Intro ──
    const anims = [
      tri && animate(svg.createDrawable(tri), { draw: ['0 0', '0 1'], duration: 1500, ease: 'inOut(3)' }),
      tri && animate(tri, { fillOpacity: [0, 1], duration: 700, delay: 1100, ease: 'out(2)' }),
      animate(slashes, {
        opacity: [0, 1],
        translateX: [700, 0],
        delay: stagger(140, { start: 600 }),
        duration: 1100,
        ease: 'outExpo',
      }),
      dot && animate(dot, {
        opacity: [0, 1],
        translateY: [-1100, 0],
        scale: [0.5, 1],
        delay: 1250,
        ease: createSpring({ mass: 1, stiffness: 120, damping: 9 }),
      }),
    ]

    // ── Pointer parallax: each layer at its own depth ──
    const section = root.closest('section') ?? root.parentElement
    const layers = Array.from(root.querySelectorAll<SVGGElement>('[data-depth]')).map((g) => ({
      depth: Number(g.dataset.depth),
      follow: createAnimatable(g, { translateX: 900, translateY: 900, rotate: 900, ease: 'out(3)' }) as AnimatableObject,
    }))
    const onMove = (e: PointerEvent) => {
      const r = section!.getBoundingClientRect()
      const nx = ((e.clientX - r.left) / r.width - 0.5) * 2
      const ny = ((e.clientY - r.top) / r.height - 0.5) * 2
      for (const l of layers) {
        l.follow.translateX(nx * l.depth)
        l.follow.translateY(ny * l.depth * 0.6)
        l.follow.rotate(nx * l.depth * 0.004)
      }
    }
    const onLeave = () => {
      for (const l of layers) {
        l.follow.translateX(0)
        l.follow.translateY(0)
        l.follow.rotate(0)
      }
    }
    section?.addEventListener('pointermove', onMove)
    section?.addEventListener('pointerleave', onLeave)

    return () => {
      section?.removeEventListener('pointermove', onMove)
      section?.removeEventListener('pointerleave', onLeave)
      layers.forEach((l) => l.follow.revert())
      anims.forEach((a) => a && a.revert())
      show()
    }
  }, [])

  return (
    <svg
      ref={svgRef}
      viewBox={EMBLEM_VIEWBOX}
      aria-hidden
      className={className}
      style={{ overflow: 'visible' }}
    >
      <g data-depth="60" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
        <path
          data-tri
          d={EMBLEM_TRIANGLE}
          fill={LOGO_COLORS.teal}
          fillOpacity={0}
          stroke={LOGO_COLORS.teal}
          strokeWidth={10}
          strokeLinejoin="round"
        />
      </g>
      <g data-depth="150" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
        {EMBLEM_SLASHES.map((d, i) => (
          <path key={i} data-slash d={d} fill={LOGO_COLORS.orange} style={{ opacity: 0 }} />
        ))}
      </g>
      <g data-depth="240" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
        <circle
          data-dot
          cx={EMBLEM_DOT.cx}
          cy={EMBLEM_DOT.cy}
          r={EMBLEM_DOT.r}
          fill={LOGO_COLORS.teal}
          style={{ opacity: 0, transformBox: 'fill-box', transformOrigin: 'center' }}
        />
      </g>
    </svg>
  )
}
