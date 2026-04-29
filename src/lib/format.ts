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

/** Formats a 10-digit Mexican phone number as "614 123 4567" */
export function fmtPhone(phone: string): string {
  const d = phone.replace(/\D/g, '')
  const local = d.startsWith('52') ? d.slice(2) : d
  if (local.length === 10) {
    return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`
  }
  return phone
}

export function slugify(text: string): string {
  return slugifyLib(text, {
    lower: true,
    strict: true,
    locale: 'es',
    trim: true,
  })
}
