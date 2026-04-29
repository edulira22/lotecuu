'use client'
import { useState, useRef, useEffect } from 'react'
import { fmtPhone } from '@/lib/format'

interface CallButtonProps {
  phone: string
  className?: string
  /** Icon-only mode for compact bars */
  iconOnly?: boolean
}

function PhoneIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
    </svg>
  )
}

export function CallButton({ phone, className, iconOnly = false }: CallButtonProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const dialable = phone.replace(/\D/g, '')
  const formatted = fmtPhone(phone)

  // Close popover on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // On touch devices → let the tel: link work directly
    // On pointer devices (desktop) → show the number popover
    if (!window.matchMedia('(pointer: coarse)').matches) {
      e.preventDefault()
      setOpen((o) => !o)
    }
  }

  const copy = async () => {
    await navigator.clipboard.writeText(formatted)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
      setOpen(false)
    }, 1500)
  }

  return (
    <div className="relative" ref={ref}>
      <a
        href={`tel:${dialable}`}
        onClick={handleClick}
        className={className}
        aria-label="Llamar"
      >
        <PhoneIcon size={iconOnly ? 16 : 13} />
        {!iconOnly && <span>Llamar</span>}
      </a>

      {/* Desktop popover — shown instead of tel: */}
      {open && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-white rounded-[14px] z-50"
          style={{
            border: '0.5px solid var(--gray-line)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
            minWidth: 210,
            padding: '16px 16px 14px',
          }}
        >
          {/* Arrow */}
          <div
            className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white rotate-45"
            style={{ border: '0.5px solid var(--gray-line)', borderTop: 'none', borderLeft: 'none' }}
          />
          <p className="text-[10px] text-text-muted uppercase tracking-[0.1em] font-[500] mb-1">
            Teléfono
          </p>
          <p
            className="text-[22px] font-[500] tracking-[0.02em] mb-3"
            style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}
          >
            {formatted}
          </p>
          <button
            type="button"
            onClick={copy}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[13px] font-[500] transition-colors"
            style={{ border: '0.5px solid var(--gray-line)' }}
          >
            {copied ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3B6D11" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span style={{ color: 'var(--color-status-green-fg)' }}>¡Copiado!</span>
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                Copiar número
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
