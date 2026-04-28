import { cn } from '@/lib/utils'
import type { VehicleStatus } from '@/lib/supabase/database.types'

const STATUS_MAP: Record<
  'available' | 'reserved' | 'sold',
  { label: string; className: string }
> = {
  available: {
    label: 'Disponible',
    className: 'bg-status-green-bg text-status-green-fg',
  },
  reserved: {
    label: 'Apartado',
    className: 'bg-status-amber-bg text-status-amber-fg',
  },
  sold: {
    label: 'Vendido',
    className: 'bg-status-gray-bg text-status-gray-fg',
  },
}

interface StatusPillProps {
  status: VehicleStatus
  className?: string
}

export function StatusPill({ status, className }: StatusPillProps) {
  const mapped =
    status === 'reserved'
      ? STATUS_MAP.reserved
      : status === 'sold'
        ? STATUS_MAP.sold
        : STATUS_MAP.available

  return (
    <span
      className={cn(
        'inline-flex items-center gap-[5px] px-[9px] py-1 rounded-pill',
        'text-[10px] font-[500] uppercase tracking-[0.1em]',
        mapped.className,
        className,
      )}
    >
      <span className="w-[5px] h-[5px] rounded-full bg-current" />
      {mapped.label}
    </span>
  )
}
