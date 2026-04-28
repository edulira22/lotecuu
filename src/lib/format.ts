import slugifyLib from 'slugify'

const priceFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
})

const kmFormatter = new Intl.NumberFormat('es-MX', {
  maximumFractionDigits: 0,
})

export function fmtPrice(amount: number): string {
  return priceFormatter.format(amount)
}

export function fmtKm(km: number): string {
  return `${kmFormatter.format(km)} km`
}

export function slugify(text: string): string {
  return slugifyLib(text, {
    lower: true,
    strict: true,
    locale: 'es',
    trim: true,
  })
}
