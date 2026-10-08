import Image from 'next/image'

/**
 * Seller identity square: logo (shown whole), else profile photo (cropped
 * to fill), else initials. Server-safe — no client JS.
 */
export function SellerMark({
  name,
  logoUrl,
  photoUrl,
  size,
  className,
}: {
  name: string
  logoUrl?: string | null
  photoUrl?: string | null
  size: number
  className?: string
}) {
  const box = `relative shrink-0 overflow-hidden rounded-[6px] flex items-center justify-center ${className ?? ''}`

  if (logoUrl) {
    return (
      <div className={`${box} bg-white`} style={{ width: size, height: size }}>
        <Image src={logoUrl} alt={`Logo de ${name}`} fill sizes={`${size * 2}px`} className="object-contain p-[8%]" />
      </div>
    )
  }
  if (photoUrl) {
    return (
      <div className={box} style={{ width: size, height: size }}>
        <Image src={photoUrl} alt={name} fill sizes={`${size * 2}px`} className="object-cover" />
      </div>
    )
  }
  return (
    <div className={`${box} bg-surface-alt`} style={{ width: size, height: size }}>
      <span className="font-[600] text-teal tracking-tight" style={{ fontSize: Math.round(size * 0.38) }}>
        {name.slice(0, 2).toUpperCase()}
      </span>
    </div>
  )
}
