import { cn } from '@/lib/utils'
import Link from 'next/link'

type Variant = 'orange' | 'ghost' | 'dark' | 'whatsapp'
type Size = 'sm' | 'md' | 'lg'

const VARIANT_CLASSES: Record<Variant, string> = {
  orange:   'bg-orange text-white hover:bg-orange-deep',
  ghost:    'bg-transparent text-text-base border-hairline border-[var(--gray-line-strong)] hover:bg-surface-alt',
  dark:     'bg-dark text-white hover:bg-dark/90',
  whatsapp: 'bg-orange text-white hover:bg-orange-deep',
}

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'h-8 px-4 text-[12px]',
  md: 'h-10 px-5 text-[13px]',
  lg: 'h-12 px-6 text-[14px]',
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  href?: string
  children: React.ReactNode
}

export function Button({
  variant = 'orange',
  size = 'md',
  href,
  className,
  children,
  ...props
}: ButtonProps) {
  const base = cn(
    'inline-flex items-center justify-center gap-2 rounded-pill font-[500]',
    'transition-colors duration-150 whitespace-nowrap cursor-pointer',
    'active:translate-y-px',
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className,
  )

  if (href) {
    return (
      <Link href={href} className={base}>
        {children}
      </Link>
    )
  }

  return (
    <button className={base} {...props}>
      {children}
    </button>
  )
}
