import { cn } from '@/lib/utils'

interface ChipProps {
  children: React.ReactNode
  className?: string
}

export function Chip({ children, className }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-chip',
        'bg-surface-alt text-text-base text-[11px] font-[500] whitespace-nowrap',
        className,
      )}
    >
      {children}
    </span>
  )
}
