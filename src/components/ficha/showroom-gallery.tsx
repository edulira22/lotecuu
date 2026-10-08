'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { animate } from 'animejs'
import type { JSAnimation } from 'animejs'
import { CarPlaceholder, getPlaceholderTone } from '@/components/ui/car-placeholder'
import { ANGLE_GROUPS, angleGroup, angleLabel } from '@/lib/photo-angles'

export interface GalleryPhoto {
  url: string
  alt_text?: string | null
  angle?: string | null
}

interface ShowroomGalleryProps {
  photos: GalleryPhoto[]
  vehicleId: string
  vehicleTitle: string
}

const STAGE_SIZES = '(max-width: 768px) 100vw, 92vw'

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Showroom-style gallery: one large stage that keeps the whole photo visible
 * (object-contain over a blurred copy of itself, so any aspect ratio looks
 * intentional), drag/swipe with momentum, animated crossfades, a progress
 * line, pose-group shortcuts and a thumbnail rail. Overlays on the photo are
 * limited to a small pose label, a counter and an expand button.
 */
export function ShowroomGallery({ photos, vehicleId, vehicleTitle }: ShowroomGalleryProps) {
  const total = photos.length
  const [index, setIndex] = useState(0)
  const [prev, setPrev] = useState<number | null>(null)
  const [lightbox, setLightbox] = useState(false)

  const dirRef = useRef<1 | -1>(1)
  const releaseDx = useRef(0)
  const anims = useRef<JSAnimation[]>([])
  const stageRef = useRef<HTMLDivElement>(null)
  const currentRef = useRef<HTMLDivElement>(null)
  const prevRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const thumbsRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number; dx: number; moved: boolean; aborted: boolean } | null>(null)

  const go = useCallback(
    (target: number, dir: 1 | -1) => {
      if (total < 2) return
      const next = ((target % total) + total) % total
      if (next === index) return
      dirRef.current = dir
      setPrev(index)
      setIndex(next)
    },
    [index, total],
  )
  const goNext = useCallback(() => go(index + 1, 1), [go, index])
  const goPrev = useCallback(() => go(index - 1, -1), [go, index])
  const goTo = useCallback((i: number) => go(i, i > index ? 1 : -1), [go, index])

  /* ── Slide transition ─────────────────────────────────── */
  useLayoutEffect(() => {
    if (prev === null) return
    anims.current.forEach((a) => a.cancel())
    anims.current = []
    const cur = currentRef.current
    const old = prevRef.current
    const w = stageRef.current?.clientWidth ?? 600
    const d = dirRef.current
    const fromDx = releaseDx.current
    releaseDx.current = 0

    if (!cur || prefersReducedMotion()) {
      setPrev(null)
      return
    }
    anims.current.push(
      animate(cur, {
        opacity: [0, 1],
        translateX: [d * w * 0.16, 0],
        scale: [1.035, 1],
        duration: 760,
        ease: 'outExpo',
      }),
    )
    if (old) {
      anims.current.push(
        animate(old, {
          opacity: [1, 0],
          translateX: [fromDx, fromDx - d * w * 0.1],
          duration: 560,
          ease: 'outExpo',
          onComplete: () => setPrev(null),
        }),
      )
    } else {
      setPrev(null)
    }
  }, [index, prev])

  /* ── Progress line + thumb rail follow the active photo ── */
  useEffect(() => {
    if (total < 2) return
    const pct = ((index + 1) / total) * 100
    if (progressRef.current) {
      if (prefersReducedMotion()) progressRef.current.style.width = `${pct}%`
      else animate(progressRef.current, { width: `${pct}%`, duration: 650, ease: 'outExpo' })
    }
    const rail = thumbsRef.current
    const thumb = rail?.children[index] as HTMLElement | undefined
    if (rail && thumb) {
      rail.scrollTo({
        left: thumb.offsetLeft - rail.clientWidth / 2 + thumb.clientWidth / 2,
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      })
    }
  }, [index, total])

  /* ── Drag / swipe ─────────────────────────────────────── */
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return
    drag.current = { x: e.clientX, y: e.clientY, dx: 0, moved: false, aborted: false }
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current
    if (!d || d.aborted) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (!d.moved) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
      if (Math.abs(dy) > Math.abs(dx)) { d.aborted = true; return } // vertical: let the page scroll
      d.moved = true
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    d.dx = dx
    if (total > 1 && currentRef.current) {
      // Rubber-band a little so it feels physical
      const eased = dx * 0.85
      currentRef.current.style.transform = `translateX(${eased}px)`
    }
  }

  function settleBack(dx: number) {
    if (currentRef.current && dx !== 0) {
      animate(currentRef.current, { translateX: [dx, 0], duration: 520, ease: 'outExpo' })
    }
  }

  function onPointerUp() {
    const d = drag.current
    drag.current = null
    if (!d || d.aborted) return
    if (!d.moved) {
      if (total > 0) setLightbox(true)
      return
    }
    const w = stageRef.current?.clientWidth ?? 600
    const eased = d.dx * 0.85
    if (total > 1 && Math.abs(d.dx) > Math.min(90, w * 0.14)) {
      releaseDx.current = eased
      if (d.dx < 0) goNext()
      else goPrev()
    } else {
      settleBack(eased)
    }
  }

  function onPointerCancel() {
    const d = drag.current
    drag.current = null
    if (d?.moved) settleBack(d.dx * 0.85)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowRight') { e.preventDefault(); goNext() }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev() }
    if (e.key === 'Enter' && e.target === e.currentTarget && total > 0) setLightbox(true)
  }

  /* ── Pose groups (only when the seller tagged photos) ── */
  const groups = useMemo(() => {
    const out: { key: string; label: string; first: number; count: number }[] = []
    for (const g of ANGLE_GROUPS) {
      let first = -1
      let count = 0
      photos.forEach((p, i) => {
        if (angleGroup(p.angle) === g.key) {
          count++
          if (first < 0) first = i
        }
      })
      if (count > 0) out.push({ key: g.key, label: g.label, first, count })
    }
    return out
  }, [photos])

  const tone = getPlaceholderTone(vehicleId)
  const active = photos[index]
  const activeLabel = angleLabel(active?.angle)
  const activeGroup = angleGroup(active?.angle)

  /* ── Render ───────────────────────────────────────────── */
  return (
    <div className="flex flex-col gap-3">
      <div
        ref={stageRef}
        role="region"
        aria-roledescription="carrusel"
        aria-label={`Fotos de ${vehicleTitle}`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        className="group relative w-full overflow-hidden rounded-[18px] md:rounded-[24px] select-none outline-none aspect-[16/11] md:aspect-auto md:h-[clamp(320px,60vh,680px)] focus-visible:ring-2 focus-visible:ring-orange"
        style={{ background: '#0E1218', touchAction: 'pan-y', cursor: total > 1 ? 'grab' : total ? 'zoom-in' : 'default' }}
      >
        {total === 0 && <CarPlaceholder tone={tone} className="absolute inset-0" />}

        {prev !== null && photos[prev] && (
          <StageLayer key={`p${prev}`} innerRef={prevRef} photo={photos[prev]} alt={vehicleTitle} z={1} />
        )}
        {active && (
          <StageLayer
            key={`c${index}`}
            innerRef={currentRef}
            photo={active}
            alt={activeLabel ? `${vehicleTitle} — ${activeLabel}` : vehicleTitle}
            z={2}
            priority={index === 0}
          />
        )}

        {/* ── Minimal overlays ── */}
        {activeLabel && (
          <span
            className="absolute top-3 left-3 md:top-4 md:left-4 z-[3] px-2.5 py-1 rounded-pill text-[11px] font-[500] text-white pointer-events-none"
            style={{ background: 'rgba(1,37,56,0.42)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
          >
            {activeLabel}
          </span>
        )}

        {total > 1 && (
          <span
            className="absolute bottom-3 left-3 md:bottom-4 md:left-4 z-[3] px-2.5 py-1 rounded-pill text-[11px] text-white pointer-events-none tabular-nums"
            style={{ background: 'rgba(1,37,56,0.42)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', fontFamily: 'ui-monospace, Menlo, monospace' }}
          >
            {pad(index + 1)} / {pad(total)}
          </span>
        )}

        {total > 0 && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setLightbox(true)}
            aria-label="Ver en pantalla completa"
            className="absolute bottom-3 right-3 md:bottom-4 md:right-4 z-[3] w-9 h-9 rounded-full flex items-center justify-center text-white transition-colors hover:bg-black/50"
            style={{ background: 'rgba(1,37,56,0.42)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          </button>
        )}

        {total > 1 && (
          <>
            <StageArrow side="left" onClick={goPrev} />
            <StageArrow side="right" onClick={goNext} />
          </>
        )}
      </div>

      {/* ── Rail: progress · pose groups · thumbnails ── */}
      {total > 1 && (
        <div className="flex flex-col gap-3">
          <div className="h-[2px] w-full rounded-full overflow-hidden" style={{ background: 'var(--gray-line-strong)' }}>
            <div ref={progressRef} className="h-full rounded-full bg-orange" style={{ width: `${(1 / total) * 100}%` }} />
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            {groups.length > 0 && (
              <div className="hidden md:flex items-center gap-1 shrink-0">
                {groups.map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => goTo(g.first)}
                    className="px-3 py-1.5 rounded-pill text-[12px] font-[500] transition-colors"
                    style={
                      activeGroup === g.key
                        ? { background: '#012538', color: '#fff' }
                        : { color: 'var(--color-text-muted)' }
                    }
                  >
                    {g.label} <span className="opacity-60 tabular-nums">{g.count}</span>
                  </button>
                ))}
              </div>
            )}

            <div
              ref={thumbsRef}
              className="flex-1 min-w-0 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5"
            >
              {photos.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={angleLabel(p.angle) ?? `Foto ${i + 1}`}
                  aria-current={i === index}
                  className="relative shrink-0 w-[76px] h-[54px] md:w-[92px] md:h-[64px] rounded-[10px] overflow-hidden transition-all duration-300"
                  style={{
                    background: '#0E1218',
                    opacity: i === index ? 1 : 0.55,
                    outline: i === index ? '2px solid var(--color-orange)' : '2px solid transparent',
                    outlineOffset: -2,
                  }}
                >
                  <Image src={p.url} alt="" fill className="object-cover" sizes="92px" draggable={false} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {lightbox && total > 0 && (
        <Lightbox
          photos={photos}
          index={index}
          title={vehicleTitle}
          onPrev={goPrev}
          onNext={goNext}
          onGo={goTo}
          onClose={() => setLightbox(false)}
        />
      )}
    </div>
  )
}

/* ── Pieces ────────────────────────────────────────────────── */

function StageLayer({
  photo, alt, z, priority, innerRef,
}: {
  photo: GalleryPhoto
  alt: string
  z: number
  priority?: boolean
  innerRef: React.Ref<HTMLDivElement>
}) {
  return (
    <div ref={innerRef} className="absolute inset-0 will-change-transform" style={{ zIndex: z }}>
      {/* Ambient fill: the same photo, blurred, so non-matching aspect ratios never show black bars */}
      <Image
        src={photo.url}
        alt=""
        aria-hidden
        fill
        sizes={STAGE_SIZES}
        className="object-cover scale-125 blur-2xl opacity-90 saturate-[1.15]"
        draggable={false}
      />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 90% at 50% 50%, rgba(14,18,24,0), rgba(14,18,24,0.32))' }} />
      <Image
        src={photo.url}
        alt={photo.alt_text ?? alt}
        fill
        sizes={STAGE_SIZES}
        priority={priority}
        className="object-contain"
        draggable={false}
      />
    </div>
  )
}

function StageArrow({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClick}
      aria-label={side === 'left' ? 'Foto anterior' : 'Foto siguiente'}
      className={`hidden md:flex absolute top-1/2 -translate-y-1/2 ${side === 'left' ? 'left-4' : 'right-4'} z-[3] w-11 h-11 rounded-full items-center justify-center text-white opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all duration-300 hover:scale-105`}
      style={{ background: 'rgba(1,37,56,0.42)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '0.5px solid rgba(255,255,255,0.25)' }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d={side === 'left' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
      </svg>
    </button>
  )
}

function Lightbox({
  photos, index, title, onPrev, onNext, onGo, onClose,
}: {
  photos: GalleryPhoto[]
  index: number
  title: string
  onPrev: () => void
  onNext: () => void
  onGo: (i: number) => void
  onClose: () => void
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLDivElement>(null)
  const touchX = useRef<number | null>(null)
  const total = photos.length
  const label = angleLabel(photos[index]?.angle)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [onPrev, onNext, onClose])

  useLayoutEffect(() => {
    if (!rootRef.current || prefersReducedMotion()) return
    animate(rootRef.current, { opacity: [0, 1], duration: 260, ease: 'outCubic' })
  }, [])

  useLayoutEffect(() => {
    if (!imgRef.current || prefersReducedMotion()) return
    animate(imgRef.current, { opacity: [0, 1], scale: [0.975, 1], duration: 420, ease: 'outExpo' })
  }, [index])

  return createPortal(
    <div
      ref={rootRef}
      className="fixed inset-0 z-[60] flex flex-col"
      style={{ background: 'rgba(6,10,14,0.96)' }}
      role="dialog"
      aria-modal="true"
      aria-label={`Fotos de ${title}`}
    >
      <div className="flex items-center justify-between px-4 md:px-6 py-3 text-white">
        <span className="text-[12px] text-white/70 tabular-nums" style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>
          {pad(index + 1)} / {pad(total)}
          {label && <span className="ml-3 text-white">{label}</span>}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div
        className="relative flex-1 min-h-0 mx-2 md:mx-20"
        onClick={onClose}
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return
          const diff = touchX.current - e.changedTouches[0].clientX
          if (Math.abs(diff) > 40) { if (diff > 0) onNext(); else onPrev() }
          touchX.current = null
        }}
      >
        <div ref={imgRef} key={index} className="absolute inset-0" onClick={(e) => e.stopPropagation()}>
          <Image
            src={photos[index].url}
            alt={photos[index].alt_text ?? (label ? `${title} — ${label}` : title)}
            fill
            sizes="100vw"
            className="object-contain"
            draggable={false}
          />
        </div>

        {total > 1 && (
          <>
            {(['left', 'right'] as const).map((side) => (
              <button
                key={side}
                type="button"
                onClick={(e) => { e.stopPropagation(); if (side === 'left') onPrev(); else onNext() }}
                aria-label={side === 'left' ? 'Anterior' : 'Siguiente'}
                className={`hidden md:flex absolute top-1/2 -translate-y-1/2 ${side === 'left' ? '-left-14' : '-right-14'} w-11 h-11 rounded-full items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d={side === 'left' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
                </svg>
              </button>
            ))}
          </>
        )}
      </div>

      {total > 1 && (
        <div className="flex gap-2 justify-center overflow-x-auto no-scrollbar px-4 py-4">
          {photos.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onGo(i)}
              aria-label={angleLabel(p.angle) ?? `Foto ${i + 1}`}
              className="relative shrink-0 w-[64px] h-[44px] rounded-[8px] overflow-hidden transition-opacity"
              style={{ opacity: i === index ? 1 : 0.4, outline: i === index ? '2px solid var(--color-orange)' : 'none', outlineOffset: -2 }}
            >
              <Image src={p.url} alt="" fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  )
}
