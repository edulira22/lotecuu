/**
 * Social post renderer (Instagram feed / Stories / WhatsApp status).
 * Draws on a <canvas> in the browser so any photo format works and the
 * preview is live. One 1080px-wide grid, fixed outer margin, everything
 * left/right aligned to it — the layout is computed from the bottom up so
 * the photo takes whatever room the text leaves.
 */
import { EMBLEM_DOT, EMBLEM_SLASHES, EMBLEM_TRIANGLE, LOGO_COLORS, WORDMARK_LETTERS } from '@/components/ui/logo-paths'
import { fmtKm, fmtPrice } from '@/lib/format'

export type PostFormat = 'post' | 'story'
export type PostTheme = 'light' | 'dark'

export const POST_SIZES: Record<PostFormat, { w: number; h: number; label: string; hint: string }> = {
  post: { w: 1080, h: 1350, label: 'Publicación', hint: 'Instagram · Facebook · 4:5' },
  story: { w: 1080, h: 1920, label: 'Historia / Estado', hint: 'Instagram · WhatsApp · 9:16' },
}

export interface PostVehicle {
  title: string
  version: string | null
  year: number | null
  mileage: number | null
  transmission: string | null
  fuel: string | null
  body_type: string | null
  price: number | null
  negotiable: boolean
  financing: boolean
  status: string
}

export interface PostSeller {
  name: string
  logo: HTMLImageElement | null
  photo: HTMLImageElement | null
}

export interface PostOptions {
  format: PostFormat
  theme: PostTheme
  photo: HTMLImageElement | null
  /** 0..1 — where to crop along the axis that overflows */
  focus: number
  showPrice: boolean
  seller: PostSeller | null
  contact: string | null
  site: string
  font: string
}

const THEMES = {
  light: {
    bg: '#FAFAF7', text: '#012538', muted: '#5B646B', line: 'rgba(1,37,56,0.14)',
    accent: '#1B768E', price: '#D97B1F', word: LOGO_COLORS.navy, frame: '#ECEFF3', markBg: '#FFFFFF',
  },
  dark: {
    bg: '#012538', text: '#FAFAF7', muted: 'rgba(250,250,247,0.64)', line: 'rgba(250,250,247,0.18)',
    accent: '#7CC3D4', price: '#FB9833', word: LOGO_COLORS.light, frame: '#0B3448', markBg: '#FFFFFF',
  },
} as const

const STATUS_BADGE: Record<string, { label: string; bg: string; fg: string }> = {
  reserved: { label: 'Apartado', bg: '#FAEEDA', fg: '#854F0B' },
  sold: { label: 'Vendido', bg: '#F1EFE8', fg: '#5F5E5A' },
}

const LOGO_W = 10381.17
const LOGO_H = 1361.73

/* ── helpers ─────────────────────────────────────────────── */

function setFont(ctx: CanvasRenderingContext2D, weight: number, size: number, family: string, tracking = 0) {
  ctx.font = `${weight} ${size}px ${family}`
  if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${tracking}px`
}

function ellipsize(ctx: CanvasRenderingContext2D, text: string, max: number) {
  if (ctx.measureText(text).width <= max) return text
  let t = text
  while (t.length > 1 && ctx.measureText(t + '…').width > max) t = t.slice(0, -1)
  return t.trimEnd() + '…'
}

/** Up to `lines` lines, greedy by words; the last one gets an ellipsis if needed */
function wrap(ctx: CanvasRenderingContext2D, text: string, max: number, lines: number) {
  const words = text.split(/\s+/)
  const out: string[] = []
  let cur = ''
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w
    if (ctx.measureText(next).width <= max || !cur) cur = next
    else { out.push(cur); cur = w }
  }
  if (cur) out.push(cur)
  if (out.length > lines) {
    const kept = out.slice(0, lines)
    kept[lines - 1] = ellipsize(ctx, out.slice(lines - 1).join(' '), max)
    return kept
  }
  return out
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, focus: number) {
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight)
  const sw = w / s
  const sh = h / s
  const sx = (img.naturalWidth - sw) * focus
  const sy = (img.naturalHeight - sh) * (sw < img.naturalWidth ? 0.5 : focus)
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawLogo(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, wordColor: string) {
  const s = h / LOGO_H
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s, s)
  ctx.fillStyle = LOGO_COLORS.teal
  ctx.fill(new Path2D(EMBLEM_TRIANGLE))
  ctx.fillStyle = LOGO_COLORS.orange
  for (const d of EMBLEM_SLASHES) ctx.fill(new Path2D(d))
  ctx.fillStyle = LOGO_COLORS.teal
  ctx.beginPath()
  ctx.arc(EMBLEM_DOT.cx, EMBLEM_DOT.cy, EMBLEM_DOT.r, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = wordColor
  for (const d of WORDMARK_LETTERS) ctx.fill(new Path2D(d))
  ctx.restore()
  return LOGO_W * s
}

function drawSellerMark(
  ctx: CanvasRenderingContext2D, seller: PostSeller, x: number, y: number, size: number,
  t: (typeof THEMES)[PostTheme], font: string,
) {
  ctx.save()
  roundRect(ctx, x, y, size, size, 6)
  ctx.clip()
  if (seller.logo) {
    ctx.fillStyle = t.markBg
    ctx.fillRect(x, y, size, size)
    const pad = size * 0.1
    const box = size - pad * 2
    const s = Math.min(box / seller.logo.naturalWidth, box / seller.logo.naturalHeight)
    const w = seller.logo.naturalWidth * s
    const h = seller.logo.naturalHeight * s
    ctx.drawImage(seller.logo, x + (size - w) / 2, y + (size - h) / 2, w, h)
  } else if (seller.photo) {
    drawCover(ctx, seller.photo, x, y, size, size, 0.5)
  } else {
    ctx.fillStyle = t.frame
    ctx.fillRect(x, y, size, size)
    setFont(ctx, 600, Math.round(size * 0.38), font)
    ctx.fillStyle = t.accent
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(seller.name.slice(0, 2).toUpperCase(), x + size / 2, y + size / 2 + 1)
  }
  ctx.restore()
}

/* ── main ────────────────────────────────────────────────── */

export function renderPost(canvas: HTMLCanvasElement, v: PostVehicle, o: PostOptions) {
  const { w: W, h: H } = POST_SIZES[o.format]
  const story = o.format === 'story'
  const t = THEMES[o.theme]
  const F = o.font
  const M = 72
  const innerW = W - M * 2
  // Stories: keep clear of Instagram's own header and reply bar
  const top = story ? 190 : 64
  const bottom = story ? H - 250 : H - M

  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  ctx.fillStyle = t.bg
  ctx.fillRect(0, 0, W, H)

  // Sizes on the type scale
  const sz = story
    ? { eyebrow: 22, title: 76, titleMin: 56, specs: 28, price: 64, small: 20, seller: 28, mark: 72 }
    : { eyebrow: 20, title: 64, titleMin: 48, specs: 26, price: 56, small: 19, seller: 26, mark: 64 }

  /* Header: logo left, location right */
  const logoH = story ? 40 : 34
  drawLogo(ctx, M, top, logoH, t.word)
  setFont(ctx, 500, sz.small, F, 3)
  ctx.fillStyle = t.muted
  ctx.textAlign = 'right'
  ctx.fillText('AUTOS USADOS · CHIHUAHUA', W - M, top + logoH / 2 + sz.small * 0.36)
  ctx.textAlign = 'left'
  const headerBottom = top + logoH

  /* Footer (fixed at the bottom) */
  const footerH = sz.mark
  const footerY = bottom - footerH
  const dividerY = footerY - 32

  /* Measure the text block */
  const showPrice = o.showPrice && !!v.price
  setFont(ctx, 500, sz.price, F, -1.2)
  const priceText = showPrice ? fmtPrice(v.price!) : ''
  const priceW = showPrice ? ctx.measureText(priceText).width : 0
  // Feed post: price in a right column. Story (narrow): price on its own row below
  const sidePrice = showPrice && !story
  const stackPrice = showPrice && story
  const titleMax = sidePrice ? innerW - priceW - 48 : innerW

  let titleSize = sz.title
  setFont(ctx, 500, titleSize, F, -titleSize * 0.02)
  while (ctx.measureText(v.title).width > titleMax && titleSize > sz.titleMin) {
    titleSize -= 2
    setFont(ctx, 500, titleSize, F, -titleSize * 0.02)
  }
  const titleLines = wrap(ctx, v.title, titleMax, 2)
  const titleLH = Math.round(titleSize * 1.06)

  const eyebrow = (v.body_type ?? '').toUpperCase()
  const specs = [v.version, v.year ? String(v.year) : null, v.mileage ? fmtKm(v.mileage) : null, v.transmission, v.fuel]
    .filter(Boolean)
    .join('  ·  ')
  const finLine = v.financing ? 'Financiamiento disponible' : ''
  const priceNote = showPrice ? (v.negotiable ? 'MXN · Negociable' : 'MXN') : ''

  const gap = story ? 18 : 14
  let blockH = 0
  // Eyebrow row: body type on the left, "PRECIO" on the right
  const eyebrowRow = !!eyebrow || sidePrice
  if (eyebrowRow) blockH += sz.eyebrow + gap
  blockH += titleLH * titleLines.length
  if (specs) blockH += gap + sz.specs
  if (finLine) blockH += gap + 4 + sz.specs
  if (sidePrice && titleLines.length === 1 && !specs) blockH += gap + sz.small
  if (stackPrice) blockH += gap * 2 + sz.price

  const blockTop = dividerY - (story ? 64 : 48) - blockH

  /* Photo fills what's left */
  const photoY = headerBottom + (story ? 48 : 36)
  const photoH = blockTop - (story ? 64 : 48) - photoY
  ctx.save()
  roundRect(ctx, M, photoY, innerW, photoH, 4)
  ctx.clip()
  ctx.fillStyle = t.frame
  ctx.fillRect(M, photoY, innerW, photoH)
  if (o.photo) drawCover(ctx, o.photo, M, photoY, innerW, photoH, o.focus)
  ctx.restore()

  const badge = STATUS_BADGE[v.status]
  if (badge) {
    setFont(ctx, 600, sz.small, F, 2.5)
    const label = badge.label.toUpperCase()
    const bw = ctx.measureText(label).width + 36
    const bh = sz.small + 26
    ctx.fillStyle = badge.bg
    roundRect(ctx, M + 24, photoY + 24, bw, bh, 3)
    ctx.fill()
    ctx.fillStyle = badge.fg
    ctx.fillText(label, M + 24 + 18, photoY + 24 + bh / 2 + sz.small * 0.36)
  }

  /* Text block */
  let y = blockTop
  const eyebrowBaseline = y + sz.eyebrow
  if (eyebrow) {
    setFont(ctx, 500, sz.eyebrow, F, 3.5)
    ctx.fillStyle = t.accent
    ctx.fillText(eyebrow, M, eyebrowBaseline)
  }
  if (eyebrowRow) y += sz.eyebrow + gap
  setFont(ctx, 500, titleSize, F, -titleSize * 0.02)
  ctx.fillStyle = t.text
  titleLines.forEach((line, i) => ctx.fillText(line, M, y + titleSize * 0.9 + titleLH * i))
  const titleBaseline = y + titleSize * 0.9
  y += titleLH * titleLines.length

  if (sidePrice) {
    // Price shares the title's first baseline, right edge of the grid
    setFont(ctx, 500, sz.price, F, -1.2)
    ctx.fillStyle = t.price
    ctx.textAlign = 'right'
    ctx.fillText(priceText, W - M, titleBaseline)
    setFont(ctx, 500, sz.small, F, 1.5)
    ctx.fillStyle = t.muted
    ctx.fillText(priceNote, W - M, titleBaseline + gap + sz.small + 2)
    setFont(ctx, 500, sz.small, F, 3)
    ctx.fillText('PRECIO', W - M, eyebrowBaseline)
    ctx.textAlign = 'left'
  }

  const specsMax = sidePrice ? innerW - Math.max(priceW, 200) - 48 : innerW
  if (specs) {
    setFont(ctx, 400, sz.specs, F)
    ctx.fillStyle = t.muted
    ctx.fillText(ellipsize(ctx, specs, specsMax), M, y + gap + sz.specs * 0.85)
    y += gap + sz.specs
  }
  if (finLine) {
    setFont(ctx, 500, sz.specs - 2, F)
    ctx.fillStyle = t.accent
    const fy = y + gap + 4 + sz.specs * 0.85
    // Small card glyph
    ctx.strokeStyle = t.accent
    ctx.lineWidth = 2.4
    const gw = sz.specs * 0.95
    const gh = gw * 0.68
    roundRect(ctx, M, fy - gh * 0.95, gw, gh, 3)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(M, fy - gh * 0.95 + gh * 0.36)
    ctx.lineTo(M + gw, fy - gh * 0.95 + gh * 0.36)
    ctx.stroke()
    ctx.fillText(finLine, M + gw + 14, fy)
    y += gap + 4 + sz.specs
  }
  if (stackPrice) {
    const py = y + gap * 2 + sz.price * 0.82
    setFont(ctx, 500, sz.price, F, -1.2)
    ctx.fillStyle = t.price
    ctx.fillText(priceText, M, py)
    setFont(ctx, 500, sz.small, F, 1.5)
    ctx.fillStyle = t.muted
    ctx.fillText(priceNote, M + priceW + 18, py)
  }

  /* Divider + footer */
  ctx.fillStyle = t.line
  ctx.fillRect(M, dividerY, innerW, 1.5)

  let fx = M
  if (o.seller) {
    drawSellerMark(ctx, o.seller, M, footerY, sz.mark, t, F)
    fx = M + sz.mark + 22
    setFont(ctx, 600, sz.seller, F, -0.3)
    ctx.fillStyle = t.text
    const nameMax = innerW - sz.mark - 22 - 330
    ctx.fillText(ellipsize(ctx, o.seller.name, nameMax), fx, footerY + sz.mark / 2 - 4)
    setFont(ctx, 400, sz.small, F)
    ctx.fillStyle = t.muted
    ctx.fillText(o.contact ? `Informes · ${o.contact}` : 'Vendedor', fx, footerY + sz.mark / 2 + sz.small + 6)
  } else if (o.contact) {
    setFont(ctx, 400, sz.small, F, 2.5)
    ctx.fillStyle = t.muted
    ctx.fillText('INFORMES', M, footerY + sz.mark / 2 - 8)
    setFont(ctx, 600, sz.seller, F)
    ctx.fillStyle = t.text
    ctx.fillText(o.contact, M, footerY + sz.mark / 2 + sz.seller - 4)
  }

  ctx.textAlign = 'right'
  setFont(ctx, 400, sz.small, F, 2.5)
  ctx.fillStyle = t.muted
  ctx.fillText('MÁS FOTOS Y DETALLES', W - M, footerY + sz.mark / 2 - 8)
  setFont(ctx, 500, sz.seller - 2, F)
  ctx.fillStyle = t.text
  ctx.fillText(o.site, W - M, footerY + sz.mark / 2 + sz.seller - 4)
  ctx.textAlign = 'left'
}

/* ── caption ─────────────────────────────────────────────── */

const tag = (s: string) => '#' + s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]/g, '')

export function buildCaption(
  v: PostVehicle & { brand: string | null; model: string | null },
  opts: { showPrice: boolean; sellerName: string | null; contact: string | null; url: string },
) {
  const lines: string[] = []
  if (v.status === 'sold') lines.push('VENDIDO', '')
  if (v.status === 'reserved') lines.push('APARTADO', '')
  lines.push([v.title, v.year, v.version].filter(Boolean).join(' '))
  if (opts.showPrice && v.price) lines.push(`${fmtPrice(v.price)} MXN${v.negotiable ? ' · negociable' : ''}`)
  const specs = [v.mileage ? fmtKm(v.mileage) : null, v.transmission, v.fuel, v.body_type].filter(Boolean)
  if (specs.length) lines.push('', specs.join(' · '))
  if (v.financing) lines.push('Financiamiento disponible.')
  lines.push('')
  if (opts.sellerName) lines.push(`Vendedor: ${opts.sellerName}`)
  if (opts.contact) lines.push(`Informes: ${opts.contact} (WhatsApp o llamada)`)
  lines.push(`Más fotos y detalles: ${opts.url}`)
  const tags = ['#AutosUsados', '#Chihuahua', v.brand && tag(v.brand), v.model && tag(v.model), '#LoteCUU']
  lines.push('', [...new Set(tags.filter(Boolean))].join(' '))
  return lines.join('\n')
}
