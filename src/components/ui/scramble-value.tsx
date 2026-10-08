'use client'

import { useEffect, useRef } from 'react'
import { animate, scrambleText } from 'animejs'

const NUMERIC = /^[\d$.,\s/%-]+$/

/**
 * Shows a value (price, km, year, transmission…) that "decodes" like a
 * departures board the first time it scrolls into view. The real text is
 * rendered from the start, so it is never missing for SEO or slow devices.
 */
export function ScrambleValue({
  value,
  delay = 0,
  className,
}: {
  value: string
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const numeric = NUMERIC.test(value)
    let anim: ReturnType<typeof animate> | null = null
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        anim = animate(el, {
          innerHTML: scrambleText({
            text: value,
            chars: numeric ? '0-9' : 'A-Za-z',
            settleDuration: numeric ? 380 : 260,
            revealRate: numeric ? 26 : 40,
            delay,
          }),
        })
      },
      { threshold: 0.6 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      anim?.revert()
      el.textContent = value
    }
  }, [value, delay])

  return (
    <span ref={ref} className={`tabular-nums ${className ?? ''}`}>
      {value}
    </span>
  )
}
