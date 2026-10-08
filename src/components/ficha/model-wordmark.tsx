'use client'

import { useEffect, useRef } from 'react'
import { animate, stagger } from 'animejs'

/**
 * Giant outlined model name that sits *behind* the photo stage and peeks out
 * above it. Purely decorative (aria-hidden); the real title is the page H1.
 * Font size is exposed as `--wm` on the parent so the stage can overlap it.
 */
export function ModelWordmark({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const letters = Array.from(text)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const spans = el.querySelectorAll<HTMLElement>('[data-l]')
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      spans.forEach((s) => (s.style.opacity = '1'))
      return
    }
    const anim = animate(spans, {
      opacity: [0, 1],
      translateY: ['45%', '0%'],
      duration: 1100,
      delay: stagger(45, { start: 120 }),
      ease: 'outExpo',
    })
    return () => { anim.revert(); spans.forEach((s) => (s.style.opacity = '1')) }
  }, [text])

  return (
    <div
      ref={ref}
      aria-hidden
      className="relative z-0 select-none pointer-events-none whitespace-nowrap overflow-hidden text-center leading-[0.82] font-[600] uppercase"
      style={{
        fontSize: 'var(--wm)',
        letterSpacing: '-0.035em',
        color: 'transparent',
        WebkitTextStroke: '1.25px rgba(1, 37, 56, 0.26)',
      }}
    >
      {letters.map((ch, i) => (
        <span key={i} data-l className="inline-block" style={{ opacity: 0 }}>
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </div>
  )
}
