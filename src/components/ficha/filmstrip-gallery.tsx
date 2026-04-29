'use client'
import { useState, useRef } from 'react'
import Image from 'next/image'
import { CarPlaceholder, getPlaceholderTone } from '@/components/ui/car-placeholder'

interface Photo {
  url: string
  alt_text?: string | null
}

interface FilmstripGalleryProps {
  photos: Photo[]
  vehicleId: string
  vehicleTitle: string
  mobile?: boolean
}

export function FilmstripGallery({ photos, vehicleId, vehicleTitle, mobile = false }: FilmstripGalleryProps) {
  const [active, setActive] = useState(0)
  const dragRef = useRef({ startX: 0, dx: 0, dragging: false })
  const [dx, setDx] = useState(0)

  const tone = getPlaceholderTone(vehicleId)
  const hasPhotos = photos.length > 0
  const items: (Photo | null)[] = hasPhotos ? photos : [null]
  const total = items.length

  const goto = (i: number) => setActive(((i % total) + total) % total)

  const frameH = mobile ? 280 : 460
  const frameW = mobile ? 320 : 720
  const peekW = mobile ? 38 : 110
  const gap = mobile ? 10 : 16
  const stride = frameW + gap

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current.startX = e.clientX
    dragRef.current.dragging = true
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.dragging) return
    const d = e.clientX - dragRef.current.startX
    dragRef.current.dx = d
    setDx(d)
  }
  const onPointerUp = () => {
    if (!dragRef.current.dragging) return
    dragRef.current.dragging = false
    const d = dragRef.current.dx
    if (Math.abs(d) > stride * 0.18) {
      goto(active + (d < 0 ? 1 : -1))
    }
    dragRef.current.dx = 0
    setDx(0)
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goto(active - 1)
    if (e.key === 'ArrowRight') goto(active + 1)
  }

  const isDragging = dragRef.current.dragging

  return (
    <div className="flex flex-col gap-3.5 select-none">
      {/* Counter */}
      <div
        className="flex items-center justify-between text-[11px] text-text-muted tracking-[0.18em] uppercase"
        style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}
      >
        <span>Carrete &middot; {String(active + 1).padStart(2, '0')} de {String(total).padStart(2, '0')}</span>
        <span className="text-[10px]">{vehicleTitle.slice(0, 20).toUpperCase()}</span>
      </div>

      {/* Viewport */}
      <div
        tabIndex={0}
        onKeyDown={onKey}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`relative overflow-hidden outline-none ${mobile ? '' : 'rounded-[14px]'}`}
        style={{
          height: frameH + 28,
          background: '#0E1218',
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'pan-y',
        }}
      >
        {/* Sprocket holes */}
        {[0, 1].map((idx) => (
          <div
            key={idx}
            className="absolute left-0 right-0 h-[14px]"
            style={{
              [idx === 0 ? 'top' : 'bottom']: 0,
              background:
                'repeating-linear-gradient(90deg, transparent 0 14px, rgba(255,255,255,0.08) 14px 22px, transparent 22px 36px)',
              borderBottom: idx === 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              borderTop: idx === 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}
          />
        ))}

        {/* Track */}
        <div
          className="absolute top-[14px] bottom-[14px] left-1/2 flex"
          style={{
            gap,
            transform: `translateX(calc(-${active * stride}px - ${frameW / 2}px + ${dx}px))`,
            transition: isDragging ? 'none' : 'transform 0.55s cubic-bezier(.2,.8,.2,1)',
          }}
        >
          {items.map((photo, i) => {
            const isActive = i === active
            return (
              <button
                key={i}
                onClick={() => !isDragging && goto(i)}
                className="relative flex-shrink-0 border-none p-0 rounded-[6px] overflow-hidden"
                style={{
                  width: frameW,
                  height: '100%',
                  cursor: isActive ? 'default' : 'pointer',
                  outline: '1px solid rgba(255,255,255,0.08)',
                  filter: isActive ? 'none' : 'saturate(0.45) brightness(0.65)',
                  transform: isActive ? 'scale(1)' : 'scale(0.96)',
                  transition: 'filter 0.4s, transform 0.4s',
                  background: 'transparent',
                }}
              >
                {photo ? (
                  <Image
                    src={photo.url}
                    alt={photo.alt_text ?? vehicleTitle}
                    fill
                    className="object-cover"
                    sizes="720px"
                    priority={i === 0}
                  />
                ) : (
                  <CarPlaceholder tone={tone} className="absolute inset-0" />
                )}
                {!isActive && (
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'radial-gradient(ellipse at center, transparent 50%, rgba(14,18,24,0.55) 100%)',
                    }}
                  />
                )}
                <div
                  className="absolute top-2.5 left-2.5 text-white/75 px-[7px] py-[3px] rounded-[3px]"
                  style={{
                    fontFamily: 'ui-monospace, Menlo, monospace',
                    fontSize: 10,
                    letterSpacing: '0.15em',
                    background: 'rgba(0,0,0,0.35)',
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
              </button>
            )
          })}
        </div>

        {/* Side tunnels */}
        <div
          className="absolute top-[14px] bottom-[14px] left-0 pointer-events-none"
          style={{
            width: peekW,
            background: 'linear-gradient(90deg, rgba(14,18,24,0.85), transparent)',
          }}
        />
        <div
          className="absolute top-[14px] bottom-[14px] right-0 pointer-events-none"
          style={{
            width: peekW,
            background: 'linear-gradient(270deg, rgba(14,18,24,0.85), transparent)',
          }}
        />

        {total > 1 && (
          <>
            <NavArrow side="left" onClick={() => goto(active - 1)} />
            <NavArrow side="right" onClick={() => goto(active + 1)} />
          </>
        )}
      </div>

      {/* Dot indicators */}
      {total > 1 && (
        <div className="flex items-center gap-1.5 justify-center">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => goto(i)}
              aria-label={`Foto ${i + 1}`}
              className="border-none p-0 cursor-pointer rounded-pill"
              style={{
                width: i === active ? 28 : 8,
                height: 4,
                background:
                  i === active ? 'var(--color-orange)' : 'rgba(30,35,43,0.18)',
                transition: 'all 0.3s cubic-bezier(.2,.8,.2,1)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function NavArrow({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center z-10 border border-white/20"
      style={{
        [side]: 18,
        background: 'rgba(255,255,255,0.12)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
      >
        {side === 'left' ? (
          <path d="M15 18l-6-6 6-6" />
        ) : (
          <path d="M9 18l6-6-6-6" />
        )}
      </svg>
    </button>
  )
}
