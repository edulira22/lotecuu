export function buildWhatsAppLink(phone: string, text: string): string {
  const cleaned = phone.replace(/\D/g, '')
  const number = cleaned.startsWith('52') ? cleaned : `52${cleaned}`
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`
}

export function vehicleInquiryText(title: string): string {
  return `Hola, vi el ${title} en LoteCUU. ¿Sigue disponible?`
}
