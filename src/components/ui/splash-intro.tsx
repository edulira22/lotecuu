'use client'

import { useEffect, useRef, useState } from 'react'
import { animate } from 'animejs'
import { EmblemSvg, playEmblemIntro, showEmblem } from '@/components/feed/hero-emblem'
import { SPLASH_KEY } from '@/lib/splash'

/**
 * Quick logo intro when the site opens on phones/tablets (the desktop hero
 * already plays it). Once per visit, ~1.4 s, tap to skip.
 */
export function SplashIntro() {
  const rootRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const root = rootRef.current
    const svg = svgRef.current
    if (!root || !svg) return
    // Hidden by CSS (seen already, desktop width, reduced motion) → nothing to do
    if (getComputedStyle(root).display === 'none') { setDone(true); return }
    try { sessionStorage.setItem(SPLASH_KEY, '1') } catch {}

    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      // Animation frames can be paused (background tab, battery saver) — never get stuck
      window.setTimeout(() => setDone(true), 450)
      animate(root, {
        opacity: 0,
        duration: 280,
        ease: 'out(2)',
        onComplete: () => setDone(true),
      })
    }

    // Page took long to become interactive: don't make people wait more
    if (performance.now() > 2000) { showEmblem(svg); finish(); return }

    const anims = playEmblemIntro(svg, 1.9)
    const timer = window.setTimeout(finish, 1150)
    root.addEventListener('pointerdown', finish)
    return () => {
      window.clearTimeout(timer)
      root.removeEventListener('pointerdown', finish)
      anims.forEach((a) => a.pause())
    }
  }, [])

  if (done) return null

  return (
    <div
      ref={rootRef}
      id="lc-splash"
      aria-hidden
      className="xl:hidden fixed inset-0 z-[100] flex items-center justify-center bg-dark"
    >
      <EmblemSvg svgRef={svgRef} className="w-[46vw] max-w-[220px] h-auto" />
    </div>
  )
}
