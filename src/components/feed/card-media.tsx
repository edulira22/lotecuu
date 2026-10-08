'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CarPlaceholder, getPlaceholderTone } from '@/components/ui/car-placeholder'

const MAX_PREVIEW = 5

interface CardMediaProps {
  href: string
  vehicleId: string
  title: string
  photoUrls: string[]
  sizes: string
  className?: string
  style?: React.CSSProperties
  /** Overlays (status / featured pills) rendered above the photo */
  children?: React.ReactNode
}

/**
 * Card photo with hover-scrub: moving the mouse across the image previews up
 * to 5 photos (like flipping through them) without leaving the feed. Extra
 * photos only load after the first hover, so the feed stays light.
 */
export function CardMedia({ href, vehicleId, title, photoUrls, sizes, className, style, children }: CardMediaProps) {
  const [active, setActive] = useState(0)
  const [armed, setArmed] = useState(false)
  const ref = useRef<HTMLAnchorElement>(null)
  const previews = photoUrls.slice(0, MAX_PREVIEW)
  const total = photoUrls.length

  function onMove(e: React.PointerEvent<HTMLAnchorElement>) {
    if (e.pointerType !== 'mouse' || previews.length < 2 || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const i = Math.min(previews.length - 1, Math.max(0, Math.floor(((e.clientX - rect.left) / rect.width) * previews.length)))
    if (i !== active) setActive(i)
  }

  return (
    <Link
      ref={ref}
      href={href}
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') setArmed(true) }}
      onPointerMove={onMove}
      onPointerLeave={() => setActive(0)}
      className={`group/media block relative overflow-hidden ${className ?? ''}`}
      style={{ background: '#0E1218', ...style }}
    >
      {previews.length === 0 ? (
        <CarPlaceholder tone={getPlaceholderTone(vehicleId)} className="absolute inset-0" />
      ) : (
        <div className="absolute inset-0 transition-transform duration-[900ms] ease-[cubic-bezier(.2,.8,.2,1)] group-hover/media:scale-[1.045]">
          {previews.map((url, i) =>
            i === 0 || armed ? (
              <Image
                key={url + i}
                src={url}
                alt={i === 0 ? title : ''}
                fill
                sizes={sizes}
                className="object-cover transition-opacity duration-300"
                style={{ opacity: i === active ? 1 : 0 }}
                draggable={false}
              />
            ) : null,
          )}
        </div>
      )}

      {/* Bottom fade keeps the indicators readable on bright photos */}
      {previews.length > 1 && (
        <div
          className="absolute inset-x-0 bottom-0 h-14 pointer-events-none opacity-0 group-hover/media:opacity-100 transition-opacity duration-300"
          style={{ background: 'linear-gradient(to top, rgba(1,37,56,0.45), transparent)' }}
        />
      )}

      {/* Scrub segments (desktop hover only) */}
      {previews.length > 1 && (
        <div className="absolute inset-x-3 bottom-2.5 flex gap-1 pointer-events-none opacity-0 group-hover/media:opacity-100 transition-opacity duration-300">
          {previews.map((_, i) => (
            <span
              key={i}
              className="h-[2.5px] flex-1 rounded-full transition-colors duration-200"
              style={{ background: i === active ? '#fff' : 'rgba(255,255,255,0.4)' }}
            />
          ))}
        </div>
      )}

      {/* Photo count — minimal, fades out while scrubbing */}
      {total > 1 && (
        <span
          className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[11px] text-white tabular-nums pointer-events-none transition-opacity duration-300 group-hover/media:opacity-0"
          style={{ background: 'rgba(1,37,56,0.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          {total}
        </span>
      )}

      {children}
    </Link>
  )
}
