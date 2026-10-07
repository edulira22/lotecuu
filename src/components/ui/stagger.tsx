'use client'

import { useEffect, useRef } from 'react'
import { animate, stagger } from 'animejs'

interface StaggerProps {
  children: React.ReactNode
  className?: string
}

/**
 * Animates the direct children of its container.
 * - Items already in the viewport: slide up slightly, staggered (no opacity
 *   change, so there is no flash and LCP content is never hidden).
 * - Items below the fold: fade + slide in when they scroll into view.
 * Remount it with a `key` to replay the animation (e.g. when filters change).
 */
export function Stagger({ children, className }: StaggerProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const items = Array.from(el.children) as HTMLElement[]
    const inView: HTMLElement[] = []
    const below: HTMLElement[] = []
    for (const item of items) {
      if (item.getBoundingClientRect().top < window.innerHeight) inView.push(item)
      else below.push(item)
    }

    if (inView.length) {
      animate(inView, {
        translateY: [18, 0],
        duration: 650,
        delay: stagger(70),
        ease: 'outExpo',
      })
    }

    if (!below.length) return

    for (const item of below) {
      item.style.opacity = '0'
      item.style.transform = 'translateY(18px)'
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const target = entry.target as HTMLElement
          observer.unobserve(target)
          animate(target, {
            opacity: [0, 1],
            translateY: [18, 0],
            duration: 650,
            ease: 'outExpo',
          })
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    below.forEach((item) => observer.observe(item))

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
