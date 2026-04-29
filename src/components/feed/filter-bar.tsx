'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useRef, useEffect, useCallback } from 'react'

/* ── Option sets ─────────────────────────────────────────────── */
const TIPO_OPTIONS = [
  { id: '', label: 'Todos los tipos' },
  { id: 'sedan', label: 'Sedán' },
  { id: 'suv', label: 'SUV' },
  { id: 'pickup', label: 'Pickup' },
  { id: 'camioneta', label: 'Camioneta' },
  { id: 'hatchback', label: 'Hatchback' },
  { id: 'coupe', label: 'Coupé' },
  { id: 'convertible', label: 'Convertible' },
]

const TRANS_OPTIONS = [
  { id: '', label: 'Cualquiera' },
  { id: 'auto', label: 'Automático' },
  { id: 'manual', label: 'Manual' },
  { id: 'cvt', label: 'CVT' },
]

const PRECIO_OPTIONS = [
  { id: '', label: 'Cualquier precio' },
  { id: '150k', label: 'Hasta $150,000' },
  { id: '250k', label: 'Hasta $250,000' },
  { id: '400k', label: 'Hasta $400,000' },
]

const ANIO_OPTIONS = [
  { id: '', label: 'Cualquier año' },
  { id: '2022', label: '2022 o más nuevo' },
  { id: '2020', label: '2020 o más nuevo' },
  { id: '2018', label: '2018 o más nuevo' },
]

/* ── Dropdown chip ───────────────────────────────────────────── */
interface DropdownProps {
  label: string
  options: { id: string; label: string }[]
  value: string
  onChange: (v: string) => void
}

function FilterDropdown({ label, options, value, onChange }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const active = options.find((o) => o.id === value)
  const isActive = !!value

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [close])

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={[
          'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-pill text-[13px] font-[500] transition-all border-hairline cursor-pointer whitespace-nowrap',
          isActive
            ? 'bg-dark text-white border-dark'
            : 'bg-surface text-text-muted border-[var(--gray-line)] hover:text-text-base hover:border-[var(--gray-line-strong)]',
        ].join(' ')}
      >
        <span>{isActive ? active?.label : label}</span>
        <svg
          width="9"
          height="9"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute top-full mt-1.5 left-0 bg-white rounded-[12px] py-1.5 z-30"
          style={{
            border: '0.5px solid var(--gray-line)',
            boxShadow: '0 6px 24px rgba(0,0,0,0.1)',
            minWidth: 168,
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                onChange(opt.id)
                close()
              }}
              className={[
                'w-full text-left px-4 py-2.5 text-[13px] font-[500] hover:bg-surface transition-colors',
                opt.id === value ? 'text-orange' : 'text-text-base',
              ].join(' ')}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── FilterBar ───────────────────────────────────────────────── */
export interface FilterBarProps {
  tipo: string
  trans: string
  precio: string
  anio: string
  dest: string
}

export function FilterBar({ tipo, trans, precio, anio, dest }: FilterBarProps) {
  const router = useRouter()
  const params = useSearchParams()

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString())
    // Remove old single-filter param if it exists
    next.delete('f')
    if (value) next.set(key, value)
    else next.delete(key)
    const qs = next.toString()
    router.push(qs ? `/autos?${qs}` : '/autos', { scroll: false })
  }

  const hasActive = !!(tipo || trans || precio || anio || dest)

  return (
    <div
      className="border-b-hairline border-[var(--gray-line)] bg-surface sticky z-20"
      style={{ top: 57 }}
    >
      <div className="flex items-center gap-2 px-5 md:px-10 py-3 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <FilterDropdown
          label="Tipo de auto"
          options={TIPO_OPTIONS}
          value={tipo}
          onChange={(v) => setParam('tipo', v)}
        />
        <FilterDropdown
          label="Transmisión"
          options={TRANS_OPTIONS}
          value={trans}
          onChange={(v) => setParam('trans', v)}
        />
        <FilterDropdown
          label="Presupuesto"
          options={PRECIO_OPTIONS}
          value={precio}
          onChange={(v) => setParam('precio', v)}
        />
        <FilterDropdown
          label="Año"
          options={ANIO_OPTIONS}
          value={anio}
          onChange={(v) => setParam('anio', v)}
        />

        {/* Destacados toggle */}
        <button
          onClick={() => setParam('dest', dest ? '' : '1')}
          className={[
            'shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-pill text-[13px] font-[500] transition-all border-hairline cursor-pointer whitespace-nowrap',
            dest
              ? 'bg-orange text-white border-orange'
              : 'bg-orange-soft text-orange border-orange-soft hover:border-orange',
          ].join(' ')}
        >
          ★ Destacados
        </button>

        {/* Clear all */}
        {hasActive && (
          <button
            onClick={() => router.push('/autos', { scroll: false })}
            className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-pill text-[12px] font-[500] text-text-muted hover:text-text-base border-hairline border-[var(--gray-line)] transition-colors whitespace-nowrap ml-1"
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Limpiar
          </button>
        )}
      </div>
    </div>
  )
}
