'use client'

import { useEffect, useRef } from 'react'
import { animate, splitText, stagger } from 'animejs'

/**
 * Letters rise into place from a clipping mask (anime.js splitText).
 * Text stays real, selectable and readable by screen readers.
 */
export function RevealText({
  children,
  className,
  delay = 0,
}: {
  children: string
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const split = splitText(el, { chars: { wrap: 'clip' } })
    const anim = animate(split.chars, {
      y: ['110%', '0%'],
      duration: 950,
      delay: stagger(16, { start: delay }),
      ease: 'outExpo',
    })
    return () => {
      anim.revert()
      split.revert()
    }
  }, [children, delay])

  return (
    <span ref={ref} className={className}>
      {children}
    </span>
  )
}
