import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type Variant = 'light' | 'dark' | 'auto'

interface LogoProps {
  variant?: Variant
  size?: 'sm' | 'md' | 'lg'
  href?: string
  className?: string
}

const SIZE_MAP = {
  sm: { width: 90,  height: 28 },
  md: { width: 110, height: 34 },
  lg: { width: 140, height: 44 },
}

export function Logo({ variant = 'auto', size = 'md', href = '/', className }: LogoProps) {
  const { width, height } = SIZE_MAP[size]

  const src =
    variant === 'dark'
      ? '/assets/logo-dark-bg.png'
      : variant === 'light'
        ? '/assets/logo-light-bg.png'
        : '/assets/logo-transparent.png'

  const img = (
    <Image
      src={src}
      alt="LoteCUU"
      width={width}
      height={height}
      priority
      className={cn('object-contain', className)}
    />
  )

  if (href) {
    return <Link href={href} className="shrink-0">{img}</Link>
  }

  return img
}

export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/assets/logo-symbol.png"
      alt="LoteCUU"
      width={size}
      height={size}
      className={cn('object-contain', className)}
    />
  )
}
