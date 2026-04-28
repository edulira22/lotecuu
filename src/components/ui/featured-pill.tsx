import { cn } from '@/lib/utils'

interface FeaturedPillProps {
  className?: string
}

export function FeaturedPill({ className }: FeaturedPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-[9px] py-1 rounded-pill',
        'bg-orange text-white text-[10px] font-[500] uppercase tracking-[0.1em]',
        className,
      )}
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
        <path d="M5 0.5L6.18 3.6L9.5 3.8L7.1 5.85L7.9 9.1L5 7.3L2.1 9.1L2.9 5.85L0.5 3.8L3.82 3.6L5 0.5Z" />
      </svg>
      Destacado
    </span>
  )
}
