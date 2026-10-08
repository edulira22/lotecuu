'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'

export interface ComboOption {
  value: string
  /** Small badge shown next to the option (e.g. "EUA") */
  tag?: string
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const MAX_RESULTS = 150

/**
 * Type-to-search select. Matches ignore accents/case; options that start with
 * the query rank first. Picking from the list is the norm, but a typed value
 * that isn't listed can still be used (shown last), so nobody gets stuck.
 */
export function Combobox({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  disabledHint,
  allowCustom = true,
  inputClassName,
  inputStyle,
}: {
  value: string
  onChange: (v: string) => void
  options: ComboOption[]
  placeholder?: string
  disabled?: boolean
  disabledHint?: string
  allowCustom?: boolean
  inputClassName?: string
  inputStyle?: React.CSSProperties
}) {
  const id = useId()
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLUListElement>(null)

  // Keep the box in sync when the value changes from outside (e.g. brand reset)
  useEffect(() => { setQuery(value) }, [value])

  const results = useMemo(() => {
    const q = norm(query)
    if (!q || q === norm(value)) return options.slice(0, MAX_RESULTS)
    const scored: { o: ComboOption; s: number }[] = []
    for (const o of options) {
      const v = norm(o.value)
      const at = v.indexOf(q)
      if (at < 0) continue
      const wordStart = at === 0 || /[\s\-/(]/.test(v[at - 1])
      scored.push({ o, s: at === 0 ? 0 : wordStart ? 1 : 2 })
    }
    return scored.sort((a, b) => a.s - b.s).slice(0, MAX_RESULTS).map((x) => x.o)
  }, [query, options, value])

  const exact = options.find((o) => norm(o.value) === norm(query))
  const showCustom = allowCustom && query.trim() !== '' && !exact
  const total = results.length + (showCustom ? 1 : 0)

  useEffect(() => { setActive(0) }, [query])

  // Keep the highlighted row visible while using the keyboard
  useEffect(() => {
    const el = listRef.current?.children[active] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [active])

  function choose(v: string) {
    onChange(v)
    setQuery(v)
    setOpen(false)
  }

  function commitTyped() {
    const t = query.trim()
    if (exact) choose(exact.value)
    else if (t && allowCustom) choose(t)
    else if (!t) choose('')
    else setQuery(value)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, Math.max(total - 1, 0))) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter') {
      if (!open) return
      e.preventDefault()
      if (active < results.length) choose(results[active].value)
      else commitTyped()
    } else if (e.key === 'Escape') { setOpen(false); setQuery(value) }
  }

  const highlight = (text: string) => {
    const q = norm(query)
    if (!q || q === norm(value)) return text
    const at = norm(text).indexOf(q)
    if (at < 0) return text
    return (
      <>
        {text.slice(0, at)}
        <strong className="font-[600] text-text-base">{text.slice(at, at + q.length)}</strong>
        {text.slice(at + q.length)}
      </>
    )
  }

  return (
    <div className="relative">
      <input
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        autoComplete="off"
        value={query}
        disabled={disabled}
        placeholder={disabled && disabledHint ? disabledHint : placeholder}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={(e) => { setOpen(true); e.currentTarget.select() }}
        onBlur={() => { setTimeout(() => { setOpen(false); commitTyped() }, 120) }}
        onKeyDown={onKeyDown}
        className={`${inputClassName ?? ''} pr-8 disabled:opacity-60 disabled:cursor-not-allowed`}
        style={inputStyle}
      />
      <svg
        aria-hidden
        width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>

      {open && !disabled && total > 0 && (
        <ul
          ref={listRef}
          id={`${id}-list`}
          role="listbox"
          className="absolute z-30 left-0 right-0 mt-1 max-h-64 overflow-y-auto py-1 bg-white rounded-[4px] text-[14px]"
          style={{ border: '0.5px solid var(--gray-line-strong)', boxShadow: '0 10px 30px -10px rgba(1,37,56,0.25)' }}
        >
          {results.map((o, i) => (
            <li
              key={o.value}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); choose(o.value) }}
              onMouseEnter={() => setActive(i)}
              className="flex items-center justify-between gap-2 px-3 py-2 cursor-pointer text-text-muted"
              style={{ background: i === active ? 'var(--color-surface-alt)' : undefined }}
            >
              <span className="truncate text-text-base">{highlight(o.value)}</span>
              {o.tag && (
                <span className="shrink-0 text-[10px] font-[500] uppercase tracking-[0.06em] px-1.5 py-0.5 rounded-[3px] bg-surface-alt text-text-muted">
                  {o.tag}
                </span>
              )}
            </li>
          ))}
          {showCustom && (
            <li
              role="option"
              aria-selected={active === results.length}
              onMouseDown={(e) => { e.preventDefault(); commitTyped() }}
              onMouseEnter={() => setActive(results.length)}
              className="px-3 py-2 cursor-pointer text-[13px] text-text-muted"
              style={{
                background: active === results.length ? 'var(--color-surface-alt)' : undefined,
                borderTop: results.length ? '0.5px solid var(--gray-line)' : undefined,
              }}
            >
              Usar «<span className="text-text-base font-[500]">{query.trim()}</span>» — no está en la lista
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
