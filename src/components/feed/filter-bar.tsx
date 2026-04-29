'use client'
import { useRouter, useSearchParams } from 'next/navigation'

const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'sedan', label: 'Sedán' },
  { id: 'suv', label: 'SUV' },
  { id: 'pickup', label: 'Pickup' },
  { id: 'camioneta', label: 'Camioneta' },
  { id: 'auto', label: 'Automático' },
  { id: 'manual', label: 'Manual' },
  { id: 'featured', label: '★ Destacados' },
  { id: 'budget', label: 'Hasta $200k' },
  { id: '2020plus', label: '2020 o más nuevo' },
]

export function FilterBar({ active }: { active: string }) {
  const router = useRouter()
  const params = useSearchParams()

  const setFilter = (id: string) => {
    const next = new URLSearchParams(params.toString())
    if (id === 'all') next.delete('f')
    else next.set('f', id)
    const qs = next.toString()
    router.push(qs ? `/autos?${qs}` : '/autos', { scroll: false })
  }

  return (
    <div
      className="border-b-hairline border-[var(--gray-line)] bg-surface sticky z-20"
      style={{ top: 57 }}
    >
      <div className="flex gap-2 px-5 md:px-10 py-3 md:py-3.5 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {FILTERS.map((f) => {
          const isActive = active === f.id
          const isFeatured = f.id === 'featured'
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={[
                'shrink-0 px-3.5 py-1.5 rounded-pill text-[13px] font-[500] transition-all whitespace-nowrap border-hairline cursor-pointer',
                isActive
                  ? 'bg-dark text-white border-dark'
                  : isFeatured
                    ? 'bg-orange-soft text-orange border-orange-soft hover:border-orange'
                    : 'bg-surface text-text-muted border-[var(--gray-line)] hover:text-text-base hover:border-[var(--gray-line-strong)]',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {f.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
