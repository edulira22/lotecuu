'use client'
import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { CarPlaceholder, getPlaceholderTone } from '@/components/ui/car-placeholder'

interface Photo {
  url: string
  alt_text?: string | null
}

interface PhotoGalleryProps {
  photos: Photo[]
  vehicleId: string
  vehicleTitle: string
}

export function PhotoGallery({ photos, vehicleId, vehicleTitle }: PhotoGalleryProps) {
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  const tone = getPlaceholderTone(vehicleId)
  const hasPhotos = photos.length > 0
  const items: (Photo | null)[] = hasPhotos ? photos : [null]
  const total = items.length

  const prev = useCallback(() => setActive((i) => (i - 1 + total) % total), [total])
  const next = useCallback(() => setActive((i) => (i + 1) % total), [total])

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => setTouchStartX(e.targetTouches[0].clientX)
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || total <= 1) return
    const diff = touchStartX - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev()
    setTouchStartX(null)
  }

  // Keyboard navigation
  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape') setLightbox(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, prev, next])

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Counter */}
        <div
          className="flex items-center justify-between text-[11px] text-text-muted uppercase tracking-[0.12em]"
          style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}
        >
          <span>{String(active + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
          <span className="truncate max-w-[200px]">{vehicleTitle.slice(0, 22).toUpperCase()}</span>
        </div>

        {/* Main image */}
        <div
          className="relative w-full rounded-xl overflow-hidden group"
          style={{ background: '#0E1218', aspectRatio: '16 / 10' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {items[active] ? (
            <Image
              src={items[active]!.url}
              alt={items[active]!.alt_text ?? vehicleTitle}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 55vw"
              priority={active === 0}
            />
          ) : (
            <CarPlaceholder tone={tone} className="absolute inset-0" />
          )}

          {/* Click overlay for lightbox */}
          {hasPhotos && (
            <button
              onClick={() => setLightbox(true)}
              className="absolute inset-0 z-[1] cursor-zoom-in bg-transparent border-none"
              aria-label="Ver en pantalla completa"
            />
          )}

          {/* Arrows */}
          {total > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-[2] w-9 h-9 rounded-full flex items-center justify-center border border-white/25 bg-black/40 hover:bg-black/65 text-white transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="Foto anterior"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-[2] w-9 h-9 rounded-full flex items-center justify-center border border-white/25 bg-black/40 hover:bg-black/65 text-white transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="Foto siguiente"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </>
          )}

          {/* Count badge */}
          {total > 1 && (
            <div
              className="absolute bottom-2.5 right-3 z-[2] text-[11px] text-white px-2 py-0.5 rounded-md pointer-events-none"
              style={{ background: 'rgba(0,0,0,0.55)', fontFamily: 'ui-monospace, Menlo, monospace' }}
            >
              {active + 1} / {total}
            </div>
          )}
        </div>

        {/* Dot indicators (≤8 photos) */}
        {total > 1 && total <= 8 && (
          <div className="flex items-center gap-1.5 justify-center">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                aria-label={`Foto ${i + 1}`}
                className="rounded-pill border-none p-0 cursor-pointer"
                style={{
                  width: i === active ? 28 : 8,
                  height: 4,
                  background: i === active ? 'var(--color-orange)' : 'rgba(30,35,43,0.18)',
                  transition: 'all 0.3s cubic-bezier(.2,.8,.2,1)',
                }}
              />
            ))}
          </div>
        )}

        {/* Thumbnail strip (2+ photos) */}
        {total > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {items.map((photo, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`relative shrink-0 w-[72px] h-[52px] rounded-lg overflow-hidden border-2 transition-all ${
                  i === active
                    ? 'border-orange opacity-100'
                    : 'border-transparent opacity-50 hover:opacity-80'
                }`}
                style={{ background: '#0E1218' }}
                aria-label={`Ir a foto ${i + 1}`}
              >
                {photo ? (
                  <Image
                    src={photo.url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="72px"
                  />
                ) : (
                  <CarPlaceholder tone={tone} />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Lightbox ─────────────────────────────────── */}
      {lightbox && items[active] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.93)' }}
          onClick={() => setLightbox(false)}
        >
          {/* Close */}
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Cerrar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Count */}
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 text-[12px] text-white/70 px-3 py-1 rounded-md"
            style={{ background: 'rgba(0,0,0,0.4)', fontFamily: 'ui-monospace, Menlo, monospace' }}
          >
            {active + 1} / {total}
          </div>

          {/* Image */}
          <div
            className="relative mx-14 md:mx-20"
            style={{ maxHeight: '88vh', maxWidth: '1200px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={items[active]!.url}
              alt={items[active]!.alt_text ?? vehicleTitle}
              width={1400}
              height={900}
              className="w-full h-auto rounded-lg"
              style={{ maxHeight: '88vh', objectFit: 'contain' }}
            />
          </div>

          {/* Arrows */}
          {total > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev() }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/22 text-white border border-white/20 transition-colors"
                aria-label="Anterior"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next() }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/22 text-white border border-white/20 transition-colors"
                aria-label="Siguiente"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}
    </>
  )
}
