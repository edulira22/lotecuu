'use client'

import { useEffect, useRef } from 'react'
import { animate, createAnimatable, createSpring, stagger, svg } from 'animejs'
import type { AnimatableObject, JSAnimation } from 'animejs'
import { EMBLEM_DOT, EMBLEM_SLASHES, EMBLEM_TRIANGLE, EMBLEM_VIEWBOX, LOGO_COLORS } from '@/components/ui/logo-paths'

const VB_W = 2700
const VB_H = 1362
/** How far (viewBox units) the dot may travel toward the pointer — the leg is ~273 away, so this keeps a wide margin */
const DOT_REACH = 120

/**
 * The emblem's signature intro: the teal leg draws itself and fills, the
 * orange slashes speed in, the dot drops and bounces. `speed` > 1 plays it
 * faster (the phone splash uses it) without changing its character.
 */
export function playEmblemIntro(root: SVGSVGElement, speed = 1): JSAnimation[] {
  const t = (ms: number) => Math.round(ms / speed)
  const tri = root.querySelector<SVGPathElement>('[data-tri]')
  const slashes = root.querySelectorAll<SVGPathElement>('[data-slash]')
  const dot = root.querySelector<SVGCircleElement>('[data-dot]')
  const anims: (JSAnimation | null)[] = [
    tri && animate(svg.createDrawable(tri), { draw: ['0 0', '0 1'], duration: t(1500), ease: 'inOut(3)' }),
    tri && animate(tri, { fillOpacity: [0, 1], duration: t(700), delay: t(1100), ease: 'out(2)' }),
    animate(slashes, {
      opacity: [0, 1],
      translateX: [700, 0],
      delay: stagger(t(140), { start: t(600) }),
      duration: t(1100),
      ease: 'outExpo',
    }),
    dot && animate(dot, {
      opacity: [0, 1],
      translateY: [-1100, 0],
      scale: [0.5, 1],
      delay: t(1250),
      ease: createSpring({ mass: 1, stiffness: 120 * speed * speed, damping: 9 * speed }),
    }),
  ]
  return anims.filter((a): a is JSAnimation => !!a)
}

/** Final state, for reduced motion or when an intro is cut short */
export function showEmblem(root: SVGSVGElement) {
  root.querySelector('[data-tri]')?.setAttribute('fill-opacity', '1')
  root.querySelectorAll<SVGElement>('[data-slash], [data-dot]').forEach((el) => (el.style.opacity = '1'))
}

/** The emblem's SVG, parts hidden until the intro reveals them */
export function EmblemSvg({ className, svgRef }: { className?: string; svgRef: React.Ref<SVGSVGElement> }) {
  return (
    <svg ref={svgRef} viewBox={EMBLEM_VIEWBOX} aria-hidden className={className} style={{ overflow: 'visible' }}>
      <path
        data-tri
        d={EMBLEM_TRIANGLE}
        fill={LOGO_COLORS.teal}
        fillOpacity={0}
        stroke={LOGO_COLORS.teal}
        strokeWidth={10}
        strokeLinejoin="round"
      />
      {EMBLEM_SLASHES.map((d, i) => (
        <path key={i} data-slash d={d} fill={LOGO_COLORS.orange} style={{ opacity: 0 }} />
      ))}
      <g data-dot-follow style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
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

/**
 * Large interactive emblem for the hero: plays the intro, then only the dot
 * follows the pointer (within reach); the leg and slashes stay put.
 */
export function HeroEmblem({ className }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const root = svgRef.current
    if (!root) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { showEmblem(root); return }

    const anims = playEmblemIntro(root)

    const section = root.closest('section') ?? root.parentElement
    const group = root.querySelector<SVGGElement>('[data-dot-follow]')
    const follow = group
      ? (createAnimatable(group, { translateX: 700, translateY: 700, ease: 'out(3)' }) as AnimatableObject)
      : null

    const onMove = (e: PointerEvent) => {
      if (!follow || e.pointerType !== 'mouse') return
      const r = root.getBoundingClientRect()
      const unit = VB_W / r.width
      // Pointer relative to the dot's resting centre, in viewBox units
      const dx = (e.clientX - (r.left + (EMBLEM_DOT.cx / VB_W) * r.width)) * unit
      const dy = (e.clientY - (r.top + (EMBLEM_DOT.cy / VB_H) * r.height)) * unit
      const dist = Math.hypot(dx, dy) || 1
      // Close by it tracks the pointer; farther away it leans toward it, never past DOT_REACH
      const k = DOT_REACH / (dist + DOT_REACH)
      follow.translateX(dx * k)
      follow.translateY(dy * k)
    }
    const onLeave = () => {
      follow?.translateX(0)
      follow?.translateY(0)
    }
    section?.addEventListener('pointermove', onMove)
    section?.addEventListener('pointerleave', onLeave)

    return () => {
      section?.removeEventListener('pointermove', onMove)
      section?.removeEventListener('pointerleave', onLeave)
      follow?.revert()
      anims.forEach((a) => a.revert())
      showEmblem(root)
    }
  }, [])

  return <EmblemSvg svgRef={svgRef} className={className} />
}
