import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

/* ── Banner logo (horizontal) ────────────────────────────────────
   SVG ratio ≈ 7.6 : 1  (logo-light.svg / logo-dark.svg)        */
const BANNER_SIZES = {
  sm: { width: 182, height: 24 },
  md: { width: 220, height: 29 },
  lg: { width: 274, height: 36 },
}

interface LogoProps {
  /** 'light' → logo-light.svg (fondo claro)
      'dark'  → logo-dark.svg  (fondo oscuro, texto blanco)
      'auto'  → logo-light.svg por default */
  variant?: 'light' | 'dark' | 'auto'
  size?: 'sm' | 'md' | 'lg'
  href?: string
  className?: string
}

export function Logo({
  variant = 'auto',
  size = 'md',
  href = '/',
  className,
}: LogoProps) {
  const { width, height } = BANNER_SIZES[size]
  const src = variant === 'dark'
    ? '/assets/logo-dark.svg'
    : '/assets/logo-light.svg'

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

  if (href) return <Link href={href} className="shrink-0">{img}</Link>
  return img
}

/* ── Icon mark (solo símbolo) ────────────────────────────────────
   SVG ratio ≈ 2 : 1  (logo-icon.svg)                           */
export function LogoMark({
  size = 32,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <Image
      src="/assets/logo-icon.svg"
      alt="LoteCUU"
      width={size * 2}
      height={size}
      className={cn('object-contain', className)}
    />
  )
}

/* ── Stacked logo (ícono + texto apilados) ───────────────────────
   SVG ratio ≈ 1.6 : 1  (logo-stacked.svg)                      */
export function LogoStacked({
  width = 140,
  href,
  className,
}: {
  width?: number
  href?: string
  className?: string
}) {
  const height = Math.round(width / 1.595)

  const img = (
    <Image
      src="/assets/logo-stacked.svg"
      alt="LoteCUU"
      width={width}
      height={height}
      className={cn('object-contain', className)}
    />
  )

  if (href) return <Link href={href} className="shrink-0">{img}</Link>
  return img
}
