'use client'
import { useRouter, useSearchParams } from 'next/navigation'

const TABS = [
  { id: 'all',      label: 'Todos' },
  { id: 'published',label: 'Disponibles' },
  { id: 'reserved', label: 'Apartados' },
  { id: 'sold',     label: 'Vendidos' },
]

export function InventoryTabs({ active }: { active: string }) {
  const router = useRouter()
  const params = useSearchParams()

  const setTab = (id: string) => {
    const next = new URLSearchParams(params.toString())
    if (id === 'all') next.delete('tab')
    else next.set('tab', id)
    const qs = next.toString()
    router.push(qs ? `?${qs}` : '?', { scroll: false })
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          className={[
            'px-3.5 py-1.5 rounded-pill text-[13px] font-[500] transition-all border-hairline cursor-pointer whitespace-nowrap',
            active === t.id
              ? 'bg-dark text-white border-dark'
              : 'bg-surface text-text-muted border-[var(--gray-line)] hover:text-text-base',
          ].join(' ')}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
