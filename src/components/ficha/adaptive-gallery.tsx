'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import {
  animate,
  createAnimatable,
  createDraggable,
  createSpring,
  scrambleText,
  stagger,
} from 'animejs'
import type { AnimatableObject, Draggable, JSAnimation } from 'animejs'
import { CarPlaceholder, getPlaceholderTone } from '@/components/ui/car-placeholder'
import { ANGLE_GROUPS, angleGroup, angleLabel } from '@/lib/photo-angles'

export interface GalleryPhoto {
  url: string
  alt_text?: string | null
  angle?: string | null
}

interface AdaptiveGalleryProps {
  photos: GalleryPhoto[]
  vehicleId: string
  vehicleTitle: string
}

/* ── Motion presets ───────────────────────────────────────── */
const NAV_SPRING = createSpring({ mass: 1, stiffness: 90, damping: 16 })
const HEIGHT_SPRING = createSpring({ mass: 1, stiffness: 110, damping: 17 })
const UI_SPRING = createSpring({ mass: 1, stiffness: 160, damping: 18 })
const ENTRANCE_SPRING = createSpring({ mass: 1, stiffness: 70, damping: 13 })

const DEFAULT_RATIO = 4 / 3
const clampRatio = (r: number) => Math.min(2.4, Math.max(0.56, r))
const pad = (n: number) => String(n).padStart(2, '0')
const SLIDE_SIZES = '(max-width: 768px) 92vw, 70vw'

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/* ── Layout: every photo keeps its own aspect ratio ───────── */
function computeGeometry(cw: number, vh: number, ratios: number[]) {
  const mobile = cw < 768
  const gap = mobile ? 10 : 24
  // Leave room on both sides so the neighbours peek in and invite a swipe
  const maxW = mobile ? cw * 0.82 : Math.min(cw * 0.62, 1040)
  const maxH = mobile ? Math.min(vh * 0.58, 520) : Math.min(vh * 0.62, 640)
  let left = 0
  const slides = ratios.map((r) => {
    const w = Math.min(maxW, maxH * r)
    const s = { w, h: w / r, left }
    left += w + gap
    return s
  })
  const snaps = slides.map((s) => cw / 2 - (s.left + s.w / 2))
  return { cw, mobile, gap, slides, snaps }
}
type Geometry = ReturnType<typeof computeGeometry>

/**
 * Photo gallery that adapts to each photo instead of forcing a frame:
 * slides keep their real proportions, the stage height springs to fit the
 * active photo, and the strip is physically draggable (throw + spring snap)
 * with depth and parallax. Labels/counters scramble in, a magnetic cursor
 * follows the pointer on desktop, and the fullscreen view flies out of the
 * photo itself (drag down to close).
 */
export function AdaptiveGallery({ photos, vehicleId, vehicleTitle }: AdaptiveGalleryProps) {
  const total = photos.length
  const [cw, setCw] = useState(0)
  const [vh, setVh] = useState(800)
  const [ratios, setRatios] = useState<number[]>(() => photos.map(() => DEFAULT_RATIO))
  const [index, setIndex] = useState(0)
  const [lightbox, setLightbox] = useState<{ index: number; origin: DOMRect } | null>(null)
  const instantHeight = useRef(false)

  const rootRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const parallaxRefs = useRef<(HTMLDivElement | null)[]>([])
  const labelChipRef = useRef<HTMLSpanElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  const counterRef = useRef<HTMLSpanElement>(null)
  const minimapRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLSpanElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const cursorTextRef = useRef<HTMLSpanElement>(null)

  const indexRef = useRef(0)
  const dragRef = useRef<Draggable | null>(null)
  const navAnim = useRef<JSAnimation | null>(null)
  const heightAnim = useRef<JSAnimation | null>(null)
  const heightReady = useRef(false)
  const measured = useRef(new Set<number>())
  const entered = useRef(false)
  const moved = useRef(false)
  const tapSlide = useRef<number | null>(null)

  const geo = useMemo(() => computeGeometry(cw, vh, ratios), [cw, vh, ratios])
  const geoRef = useRef<Geometry>(geo)
  geoRef.current = geo
  const ready = cw > 0

  /* ── Measure the container ───────────────────────────── */
  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    // Measure right away (don't wait for the first observer callback)
    setCw(Math.round(el.clientWidth))
    setVh(window.innerHeight)
    const ro = new ResizeObserver(([entry]) => {
      setCw(Math.round(entry.contentRect.width))
      setVh(window.innerHeight)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const onPhotoLoad = useCallback((i: number, img: HTMLImageElement) => {
    if (!img.naturalWidth || !img.naturalHeight) return
    measured.current.add(i)
    const r = clampRatio(img.naturalWidth / img.naturalHeight)
    setRatios((prev) => {
      if (Math.abs(prev[i] - r) >= 0.005) return prev.map((v, j) => (j === i ? r : v))
      // Guess was right: the stage already has the correct height
      if (i === indexRef.current) heightReady.current = true
      return prev
    })
  }, [])

  /* ── Depth + parallax, painted on every drag frame ───── */
  const paint = useCallback((x: number) => {
    const g = geoRef.current
    const stageH = stageRef.current?.clientHeight ?? 0
    g.slides.forEach((s, i) => {
      const el = slideRefs.current[i]
      if (!el) return
      const d = (x + s.left + s.w / 2 - g.cw / 2) / (g.cw * 0.55)
      const ad = Math.min(Math.abs(d), 1)
      const fit = stageH > 0 ? Math.min(1, (stageH + 0.5) / s.h) : 1
      // Shrink away from the centre so the edge nearest the active photo stays put
      el.style.transformOrigin = d > 0.02 ? 'left center' : d < -0.02 ? 'right center' : 'center'
      el.style.transform = `scale(${Math.min(1 - 0.12 * ad, fit).toFixed(4)})`
      el.style.opacity = (1 - 0.55 * ad).toFixed(3)
      const p = parallaxRefs.current[i]
      if (p) p.style.transform = `translate3d(${(-d * 5).toFixed(2)}%,0,0) scale(${(1 + 0.12 * ad).toFixed(4)})`
    })
  }, [])

  const nearestIndex = (x: number) => {
    const snaps = geoRef.current.snaps
    let best = 0
    for (let i = 1; i < snaps.length; i++) {
      if (Math.abs(snaps[i] - x) < Math.abs(snaps[best] - x)) best = i
    }
    return best
  }

  const syncIndex = useCallback((x: number) => {
    const n = nearestIndex(x)
    if (n !== indexRef.current) {
      indexRef.current = n
      setIndex(n)
    }
  }, [])

  const goTo = useCallback((i: number) => {
    const d = dragRef.current
    const target = geoRef.current.snaps[Math.max(0, Math.min(geoRef.current.snaps.length - 1, i))]
    if (!d || target === undefined) return
    navAnim.current?.cancel()
    if (reducedMotion()) { d.setX(target); return }
    const proxy = { x: d.x }
    navAnim.current = animate(proxy, { x: target, ease: NAV_SPRING, onUpdate: () => d.setX(proxy.x) })
  }, [])

  /** Instant (no animation) — used to quietly line the strip up behind the fullscreen view */
  const jumpTo = useCallback((i: number) => {
    const d = dragRef.current
    const target = geoRef.current.snaps[i]
    if (!d || target === undefined || i === indexRef.current) return
    navAnim.current?.cancel()
    instantHeight.current = true
    d.setX(target)
  }, [])

  const openLightbox = useCallback((i: number) => {
    const card = cardRefs.current[i]
    setLightbox({
      index: i,
      origin: card?.getBoundingClientRect() ?? new DOMRect(window.innerWidth / 2, window.innerHeight / 2, 1, 1),
    })
  }, [])

  /* ── Physical drag (anime.js Draggable) ──────────────── */
  useEffect(() => {
    if (!ready || total < 2 || !trackRef.current || !viewportRef.current) return
    const drag = createDraggable(trackRef.current, {
      trigger: viewportRef.current,
      y: false,
      x: { snap: () => geoRef.current.snaps },
      cursor: false,
      velocityMultiplier: 1.35,
      releaseStiffness: 110,
      releaseDamping: 17,
      onGrab: () => {
        navAnim.current?.cancel()
        moved.current = false
        if (cursorRef.current) animate(cursorRef.current, { scale: 0.82, ease: UI_SPRING })
      },
      onDrag: () => { moved.current = true },
      onRelease: () => {
        if (cursorRef.current) animate(cursorRef.current, { scale: 1, ease: UI_SPRING })
        const tapped = tapSlide.current
        tapSlide.current = null
        if (moved.current || tapped === null) return
        if (tapped === indexRef.current) openLightbox(tapped)
        else goTo(tapped)
      },
      onUpdate: (self) => {
        paint(self.x)
        syncIndex(self.x)
      },
    })
    drag.setX(geoRef.current.snaps[indexRef.current] ?? 0, true)
    paint(drag.x)
    dragRef.current = drag
    return () => {
      navAnim.current?.cancel()
      drag.revert()
      dragRef.current = null
    }
  }, [ready, total, paint, syncIndex, goTo, openLightbox])

  /* ── Re-centre when the layout changes (resize, ratios) ─ */
  useEffect(() => {
    const d = dragRef.current
    if (!d) {
      // Single photo (no drag): just centre it
      if (trackRef.current && geo.snaps[0] !== undefined) trackRef.current.style.transform = `translateX(${geo.snaps[0]}px)`
      paint(geo.snaps[0] ?? 0)
      return
    }
    d.refresh()
    d.setX(geo.snaps[indexRef.current] ?? 0, true)
    paint(d.x)
  }, [geo, paint])

  /* ── Stage height springs to the active photo ────────── */
  useLayoutEffect(() => {
    const st = stageRef.current
    const s = geo.slides[index]
    if (!st || !s || !ready) return
    const h = Math.round(s.h)
    // Until the real proportions of the active photo are known, snap instead of animating
    // (otherwise every page load would show the frame shrinking from a guessed size)
    if (!heightReady.current || instantHeight.current || reducedMotion()) {
      heightAnim.current?.cancel()
      st.style.height = `${h}px`
      instantHeight.current = false
      if (measured.current.has(index)) heightReady.current = true
      paint(dragRef.current?.x ?? geo.snaps[index] ?? 0)
      return
    }
    heightAnim.current?.cancel()
    heightAnim.current = animate(st, {
      height: h,
      ease: HEIGHT_SPRING,
      onUpdate: () => paint(dragRef.current?.x ?? 0),
    })
  }, [index, geo, ready, paint])

  /* ── Scrambled pose label + counter ──────────────────── */
  useEffect(() => {
    const label = angleLabel(photos[index]?.angle)
    const counter = `${pad(index + 1)} / ${pad(total)}`
    const motion = !reducedMotion()
    if (labelChipRef.current) {
      labelChipRef.current.style.display = label ? '' : 'none'
    }
    if (labelRef.current && label) {
      if (motion) animate(labelRef.current, { innerHTML: scrambleText({ text: label, chars: 'a-zA-Z', cursor: '▍' }) })
      else labelRef.current.textContent = label
    }
    if (counterRef.current) {
      if (motion) animate(counterRef.current, { innerHTML: scrambleText({ text: counter, chars: '0-9', settleDuration: 220 }) })
      else counterRef.current.textContent = counter
    }
  }, [index, total, photos, ready])

  /* ── Minimap indicator glides to the active thumb ────── */
  useEffect(() => {
    const map = minimapRef.current
    const ind = indicatorRef.current
    const thumb = map?.querySelectorAll<HTMLElement>('[data-thumb]')[index]
    if (!map || !ind || !thumb) return
    const params = { translateX: thumb.offsetLeft, width: thumb.offsetWidth, height: thumb.offsetHeight }
    if (reducedMotion()) {
      ind.style.transform = `translateX(${params.translateX}px)`
      ind.style.width = `${params.width}px`
    } else {
      animate(ind, { ...params, ease: UI_SPRING })
    }
    map.scrollTo({ left: thumb.offsetLeft - map.clientWidth / 2 + thumb.offsetWidth / 2, behavior: reducedMotion() ? 'auto' : 'smooth' })
  }, [index, ratios, ready])

  /* ── Entrance: slides deal in from the right ─────────── */
  useEffect(() => {
    if (!ready || entered.current) return
    entered.current = true
    const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[]
    if (reducedMotion() || cards.length === 0) {
      cards.forEach((c) => { c.style.opacity = '1' })
      return
    }
    const [first, ...rest] = cards
    animate(first, { scale: [0.94, 1], ease: ENTRANCE_SPRING })
    if (rest.length) {
      animate(rest, {
        opacity: [0, 1],
        translateX: [140, 0],
        rotate: [3, 0],
        delay: stagger(80, { start: 120 }),
        ease: ENTRANCE_SPRING,
      })
    }
  }, [ready])

  /* ── Magnetic cursor (fine pointers only) ────────────── */
  useEffect(() => {
    const vp = viewportRef.current
    const cur = cursorRef.current
    if (!ready || !vp || !cur || !window.matchMedia('(pointer: fine)').matches || reducedMotion()) return
    const follow: AnimatableObject = createAnimatable(cur, { x: 420, y: 420, ease: 'out(3)' })
    let visible = false
    let lastText = ''
    const setText = (t: string) => {
      if (t === lastText || !cursorTextRef.current) return
      lastText = t
      animate(cursorTextRef.current, { innerHTML: scrambleText({ text: t, chars: 'a-z', settleDuration: 160 }) })
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      if (!visible) {
        follow.x(e.clientX, 0)
        follow.y(e.clientY, 0)
        animate(cur, { scale: [0, 1], opacity: [0, 1], ease: UI_SPRING })
        visible = true
      } else {
        follow.x(e.clientX)
        follow.y(e.clientY)
      }
      const slide = (e.target as HTMLElement).closest<HTMLElement>('[data-slide]')
      const i = slide ? Number(slide.dataset.slide) : -1
      setText(i === indexRef.current ? 'Ampliar' : i >= 0 ? 'Ver' : total > 1 ? 'Arrastra' : 'Ampliar')
    }
    const onLeave = () => {
      visible = false
      animate(cur, { scale: 0, opacity: 0, duration: 220, ease: 'out(2)' })
    }
    vp.addEventListener('pointermove', onMove)
    vp.addEventListener('pointerleave', onLeave)
    vp.style.cursor = 'none'
    return () => {
      vp.removeEventListener('pointermove', onMove)
      vp.removeEventListener('pointerleave', onLeave)
      vp.style.cursor = ''
      follow.revert()
    }
  }, [ready, total])

  /* ── Keyboard ────────────────────────────────────────── */
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(indexRef.current + 1) }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(indexRef.current - 1) }
    if (e.key === 'Enter' && total > 0) openLightbox(indexRef.current)
  }

  /* ── Pose group shortcuts ────────────────────────────── */
  const groups = useMemo(() => {
    const out: { key: string; label: string; first: number; count: number }[] = []
    for (const g of ANGLE_GROUPS) {
      const idx = photos.flatMap((p, i) => (angleGroup(p.angle) === g.key ? [i] : []))
      if (idx.length) out.push({ key: g.key, label: g.label, first: idx[0], count: idx.length })
    }
    return out
  }, [photos])
  const activeGroup = angleGroup(photos[index]?.angle)

  /* ── Render ──────────────────────────────────────────── */
  if (total === 0) {
    return (
      <div className="relative w-full aspect-[16/10] rounded-[8px] overflow-hidden" style={{ background: '#0E1218' }}>
        <CarPlaceholder tone={getPlaceholderTone(vehicleId)} className="absolute inset-0" />
      </div>
    )
  }

  return (
    <div ref={rootRef} className="flex flex-col gap-4">
      {/* Stage */}
      <div
        ref={stageRef}
        className="relative w-full"
        style={ready ? undefined : { aspectRatio: '4 / 3', maxHeight: '62vh' }}
      >
        {/* Server/first paint: the cover photo alone (keeps LCP fast) */}
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative h-full max-w-full rounded-[6px] overflow-hidden" style={{ aspectRatio: '4 / 3' }}>
              <Image src={photos[0].url} alt={vehicleTitle} fill priority sizes={SLIDE_SIZES} className="object-cover" />
            </div>
          </div>
        )}

        {ready && (
          <div
            ref={viewportRef}
            tabIndex={0}
            role="region"
            aria-roledescription="carrusel"
            aria-label={`Fotos de ${vehicleTitle}`}
            onKeyDown={onKeyDown}
            onPointerDown={(e) => {
              const s = (e.target as HTMLElement).closest<HTMLElement>('[data-slide]')
              tapSlide.current = s ? Number(s.dataset.slide) : null
            }}
            onClick={() => { if (total < 2) openLightbox(0) }}
            className="absolute inset-0 overflow-hidden outline-none select-none focus-visible:ring-2 focus-visible:ring-orange/50 rounded-[8px]"
            style={{ touchAction: 'pan-y' }}
          >
            <div ref={trackRef} className="absolute left-0 top-0 h-full flex items-center will-change-transform" style={{ gap: geo.gap }}>
              {photos.map((p, i) => {
                const s = geo.slides[i]
                const label = angleLabel(p.angle)
                return (
                  <div
                    key={i}
                    ref={(el) => { slideRefs.current[i] = el }}
                    data-slide={i}
                    className="relative shrink-0 will-change-transform"
                    style={{ width: s.w, height: s.h }}
                  >
                    <div
                      ref={(el) => { cardRefs.current[i] = el }}
                      className="absolute inset-0 rounded-[6px] md:rounded-[8px] overflow-hidden"
                      style={{
                        background: '#0E1218',
                        opacity: i === 0 ? 1 : 0,
                        boxShadow: '0 24px 60px -24px rgba(1,37,56,0.45)',
                      }}
                    >
                      <div ref={(el) => { parallaxRefs.current[i] = el }} className="absolute inset-0 will-change-transform">
                        <Image
                          src={p.url}
                          alt={p.alt_text ?? (label ? `${vehicleTitle} — ${label}` : vehicleTitle)}
                          fill
                          sizes={SLIDE_SIZES}
                          priority={i === 0}
                          className="object-cover pointer-events-none"
                          draggable={false}
                          onLoad={(e) => onPhotoLoad(i, e.currentTarget)}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Minimal overlays (siblings of the drag surface, so they never start a drag) */}
        {ready && (
          <>
            <span
              ref={labelChipRef}
              className="absolute top-3 left-3 md:top-4 md:left-5 z-[2] px-2.5 py-1 rounded-pill text-[11px] font-[500] text-white pointer-events-none"
              style={{ background: 'rgba(1,37,56,0.5)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'none' }}
            >
              <span ref={labelRef} />
            </span>
            {total > 1 && (
              <>
                <GlassButton side="left" label="Foto anterior" onClick={() => goTo(indexRef.current - 1)} disabled={index === 0} />
                <GlassButton side="right" label="Foto siguiente" onClick={() => goTo(indexRef.current + 1)} disabled={index === total - 1} />
              </>
            )}
          </>
        )}
      </div>

      {/* Rail: counter · pose groups · proportional minimap */}
      {ready && total > 1 && (
        <div className="flex items-center gap-3 md:gap-5">
          <span
            ref={counterRef}
            className="shrink-0 text-[12px] text-text-muted tabular-nums w-[58px]"
            style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}
          />
          {groups.length > 0 && (
            <div className="hidden md:flex items-center gap-1 shrink-0">
              {groups.map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => goTo(g.first)}
                  className="px-3 py-1.5 rounded-pill text-[12px] font-[500] transition-colors duration-300"
                  style={activeGroup === g.key ? { background: '#012538', color: '#fff' } : { color: 'var(--color-text-muted)' }}
                >
                  {g.label} <span className="opacity-60 tabular-nums">{g.count}</span>
                </button>
              ))}
            </div>
          )}
          <div ref={minimapRef} className="relative flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {photos.map((p, i) => (
              <button
                key={i}
                type="button"
                data-thumb
                onClick={() => goTo(i)}
                aria-label={angleLabel(p.angle) ?? `Foto ${i + 1}`}
                aria-current={i === index}
                className="relative shrink-0 h-[44px] md:h-[52px] rounded-[4px] overflow-hidden transition-[opacity,filter] duration-300"
                style={{
                  width: `calc(${(ratios[i] ?? DEFAULT_RATIO).toFixed(3)} * ${geo.mobile ? 44 : 52}px)`,
                  background: '#0E1218',
                  opacity: i === index ? 1 : 0.5,
                  filter: i === index ? 'none' : 'grayscale(0.4)',
                }}
              >
                <Image src={p.url} alt="" fill className="object-cover" sizes="120px" draggable={false} />
              </button>
            ))}
            <span
              ref={indicatorRef}
              aria-hidden
              className="absolute left-0 top-1 rounded-[4px] pointer-events-none"
              style={{ boxShadow: 'inset 0 0 0 2px var(--color-orange), 0 0 0 3px rgba(251,152,51,0.18)' }}
            />
          </div>
        </div>
      )}

      {/* Magnetic cursor */}
      {ready &&
        createPortal(
          <div
            ref={cursorRef}
            aria-hidden
            className="fixed left-0 top-0 z-[55] pointer-events-none -ml-[44px] -mt-[44px] w-[88px] h-[88px] rounded-full flex items-center justify-center gap-1 text-[11px] font-[500] text-white"
            style={{ opacity: 0, background: 'rgba(1,37,56,0.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '0.5px solid rgba(255,255,255,0.35)' }}
          >
            {total > 1 && <span className="opacity-70">‹</span>}
            <span ref={cursorTextRef}>{total > 1 ? 'Arrastra' : 'Ampliar'}</span>
            {total > 1 && <span className="opacity-70">›</span>}
          </div>,
          document.body,
        )}

      {lightbox && (
        <Lightbox
          photos={photos}
          ratios={ratios}
          startIndex={lightbox.index}
          origin={lightbox.origin}
          title={vehicleTitle}
          onSync={jumpTo}
          getReturnRect={(i) => cardRefs.current[i]?.getBoundingClientRect() ?? null}
          onClosed={() => setLightbox(null)}
        />
      )}
    </div>
  )
}

/* ── Glass arrow ─────────────────────────────────────────── */
function GlassButton({ side, label, onClick, disabled }: { side: 'left' | 'right'; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`hidden md:flex absolute top-1/2 -translate-y-1/2 ${side === 'left' ? 'left-3' : 'right-3'} z-[2] w-11 h-11 rounded-[4px] items-center justify-center text-white transition-all duration-300 hover:scale-110 disabled:opacity-0 disabled:pointer-events-none`}
      style={{ background: 'rgba(1,37,56,0.5)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '0.5px solid rgba(255,255,255,0.3)' }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d={side === 'left' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
      </svg>
    </button>
  )
}

/* ── Lightbox: flies out of the slide, drag down to close ─── */
function fitRect(ratio: number) {
  const mobile = window.innerWidth < 768
  const maxW = window.innerWidth - (mobile ? 16 : 180)
  const maxH = window.innerHeight - (mobile ? 170 : 190)
  const w = Math.min(maxW, maxH * ratio)
  const h = w / ratio
  return { left: (window.innerWidth - w) / 2, top: (window.innerHeight - h) / 2 - (mobile ? 20 : 16), width: w, height: h }
}

const BACK_SPRING = createSpring({ mass: 1, stiffness: 220, damping: 22 })
const SWIPE_DISTANCE = 80
const DISMISS_DISTANCE = 120

/**
 * Fullscreen viewer. Gestures lock to one axis as soon as the finger moves:
 * sideways changes photo (with resistance at the ends), down/up dismisses.
 * The page behind stays hidden (solid backdrop) and the gallery under it is
 * only re-aligned once, silently, when closing.
 */
function Lightbox({
  photos, ratios, startIndex, origin, title, onSync, getReturnRect, onClosed,
}: {
  photos: GalleryPhoto[]
  ratios: number[]
  startIndex: number
  origin: DOMRect
  title: string
  onSync: (i: number) => void
  getReturnRect: (i: number) => DOMRect | null
  onClosed: () => void
}) {
  const total = photos.length
  const [idx, setIdx] = useState(startIndex)
  const idxRef = useRef(startIndex)
  idxRef.current = idx
  const navDir = useRef<1 | -1>(1)
  const backdropRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const panRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLDivElement>(null)
  const chromeRef = useRef<HTMLDivElement>(null)
  const closing = useRef(false)
  const backAnim = useRef<JSAnimation | null>(null)
  const gesture = useRef<{ x: number; y: number; dx: number; dy: number; axis: 'x' | 'y' | null } | null>(null)
  const cb = useRef({ onSync, getReturnRect, onClosed })
  cb.current = { onSync, getReturnRect, onClosed }
  const label = angleLabel(photos[idx]?.angle)
  const [initialRect] = useState(() => fitRect(ratios[startIndex] ?? DEFAULT_RATIO))

  const go = useCallback((i: number) => {
    if (i < 0 || i >= total || i === idxRef.current || closing.current) return
    navDir.current = i > idxRef.current ? 1 : -1
    setIdx(i)
  }, [total])

  /** Fly back into the gallery slide of the photo being viewed */
  const close = useCallback(() => {
    if (closing.current) return
    closing.current = true
    const i = idxRef.current
    cb.current.onSync(i)
    // Let the strip settle under us before measuring where to land
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const frame = frameRef.current
      const pan = panRef.current
      const target = cb.current.getReturnRect(i)
      if (!frame || !pan || !target || reducedMotion()) { cb.current.onClosed(); return }
      // Fold the current drag offset/scale into the frame so the motion is continuous
      const r = pan.getBoundingClientRect()
      Object.assign(frame.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` })
      pan.style.transform = 'none'
      if (backdropRef.current) animate(backdropRef.current, { opacity: 0, duration: 380, ease: 'out(3)' })
      if (chromeRef.current) animate(chromeRef.current, { opacity: 0, duration: 180 })
      animate(frame, {
        left: target.left, top: target.top, width: target.width, height: target.height,
        ease: createSpring({ stiffness: 150, damping: 20 }),
        onComplete: () => cb.current.onClosed(),
      })
    }))
  }, [])

  // Open: FLIP from the slide's rect to the fitted rect
  useLayoutEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (!reducedMotion()) {
      if (backdropRef.current) animate(backdropRef.current, { opacity: [0, 1], duration: 380, ease: 'out(3)' })
      animate(frame, {
        left: [origin.left, initialRect.left],
        top: [origin.top, initialRect.top],
        width: [origin.width, initialRect.width],
        height: [origin.height, initialRect.height],
        ease: createSpring({ stiffness: 120, damping: 17 }),
      })
      if (chromeRef.current) animate(chromeRef.current, { opacity: [0, 1], translateY: [10, 0], delay: 160, duration: 500, ease: 'out(3)' })
    }
    return () => { document.body.style.overflow = overflow }
  }, [origin, initialRect])

  // Photo change: the frame morphs to the new proportions, the photo slides in from its side
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    const frame = frameRef.current
    if (!frame || closing.current) return
    const r = fitRect(ratios[idx] ?? DEFAULT_RATIO)
    if (reducedMotion()) {
      Object.assign(frame.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` })
      return
    }
    animate(frame, { ...r, ease: createSpring({ stiffness: 130, damping: 18 }) })
    if (imgRef.current) {
      animate(imgRef.current, { opacity: [0, 1], translateX: [navDir.current * 70, 0], duration: 520, ease: 'out(4)' })
    }
  }, [idx, ratios])

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') go(idxRef.current + 1)
      if (e.key === 'ArrowLeft') go(idxRef.current - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close, go])

  /* ── Axis-locked gestures ── */
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0 || closing.current) return
    backAnim.current?.cancel()
    gesture.current = { x: e.clientX, y: e.clientY, dx: 0, dy: 0, axis: null }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const g = gesture.current
    const pan = panRef.current
    if (!g || !pan) return
    g.dx = e.clientX - g.x
    g.dy = e.clientY - g.y
    if (!g.axis) {
      if (Math.max(Math.abs(g.dx), Math.abs(g.dy)) < 8) return
      g.axis = Math.abs(g.dx) > Math.abs(g.dy) ? 'x' : 'y'
    }
    if (g.axis === 'x') {
      const atEdge = (g.dx > 0 && idxRef.current === 0) || (g.dx < 0 && idxRef.current === total - 1)
      const tx = total < 2 ? g.dx * 0.15 : atEdge ? g.dx * 0.25 : g.dx
      pan.style.transform = `translate3d(${tx}px,0,0)`
    } else {
      const scale = 1 - Math.min(Math.abs(g.dy) / 1600, 0.22)
      pan.style.transform = `translate3d(0,${g.dy}px,0) scale(${scale})`
      if (backdropRef.current) backdropRef.current.style.opacity = String(1 - Math.min(Math.abs(g.dy) / 420, 0.7))
    }
  }

  function springBack() {
    const pan = panRef.current
    if (!pan) return
    backAnim.current = animate(pan, { translateX: 0, translateY: 0, scale: 1, ease: BACK_SPRING })
    if (backdropRef.current) animate(backdropRef.current, { opacity: 1, duration: 260, ease: 'out(2)' })
  }

  function onPointerUp() {
    const g = gesture.current
    gesture.current = null
    if (!g || !g.axis) return
    if (g.axis === 'y') {
      if (Math.abs(g.dy) > DISMISS_DISTANCE) close()
      else springBack()
      return
    }
    const next = g.dx < 0 ? idxRef.current + 1 : idxRef.current - 1
    if (Math.abs(g.dx) > SWIPE_DISTANCE && next >= 0 && next < total) {
      if (panRef.current) panRef.current.style.transform = 'none'
      go(next)
    } else {
      springBack()
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={`Fotos de ${title}`}>
      <div ref={backdropRef} className="absolute inset-0" style={{ background: '#05090D' }} onClick={() => close()} />

      <div
        ref={frameRef}
        className="absolute"
        style={{ left: initialRect.left, top: initialRect.top, width: initialRect.width, height: initialRect.height }}
      >
        <div
          ref={panRef}
          className="absolute inset-0 touch-none select-none cursor-grab active:cursor-grabbing will-change-transform"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div ref={imgRef} key={idx} className="absolute inset-0 overflow-hidden" style={{ borderRadius: 6 }}>
            <Image
              src={photos[idx].url}
              alt={photos[idx].alt_text ?? (label ? `${title} — ${label}` : title)}
              fill
              sizes="100vw"
              className="object-cover pointer-events-none"
              draggable={false}
            />
          </div>
        </div>
      </div>

      {/* Chrome */}
      <div ref={chromeRef} className="pointer-events-none absolute inset-0">
        <div className="pointer-events-auto absolute top-0 inset-x-0 flex items-center justify-between px-4 md:px-6 py-3 text-white">
          <span className="text-[12px] text-white/70 tabular-nums" style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>
            {pad(idx + 1)} / {pad(total)}
            {label && <span className="ml-3 text-white" style={{ fontFamily: 'var(--font-sans)' }}>{label}</span>}
          </span>
          <button
            type="button"
            onClick={() => close()}
            aria-label="Cerrar"
            className="w-10 h-10 rounded-[4px] flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {total > 1 && (
          <>
            {(['left', 'right'] as const).map((side) => {
              const disabled = side === 'left' ? idx === 0 : idx === total - 1
              return (
                <button
                  key={side}
                  type="button"
                  disabled={disabled}
                  onClick={() => go(side === 'left' ? idx - 1 : idx + 1)}
                  aria-label={side === 'left' ? 'Anterior' : 'Siguiente'}
                  className={`pointer-events-auto hidden md:flex absolute top-1/2 -translate-y-1/2 ${side === 'left' ? 'left-5' : 'right-5'} w-12 h-12 rounded-[4px] items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-0`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d={side === 'left' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
                  </svg>
                </button>
              )
            })}
            <div className="pointer-events-auto absolute bottom-0 inset-x-0 flex gap-2 justify-center overflow-x-auto no-scrollbar px-4 py-4">
              {photos.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={angleLabel(p.angle) ?? `Foto ${i + 1}`}
                  className="relative shrink-0 h-[44px] rounded-[4px] overflow-hidden transition-opacity"
                  style={{
                    width: `calc(${(ratios[i] ?? DEFAULT_RATIO).toFixed(3)} * 44px)`,
                    opacity: i === idx ? 1 : 0.4,
                    outline: i === idx ? '2px solid var(--color-orange)' : 'none',
                    outlineOffset: -2,
                  }}
                >
                  <Image src={p.url} alt="" fill className="object-cover" sizes="100px" />
                </button>
              ))}
            </div>
            <p className="absolute bottom-[72px] inset-x-0 text-center text-[11px] text-white/40 md:hidden">
              Desliza para cambiar · arrastra hacia abajo para cerrar
            </p>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
