/**
 * Social post renderer (Instagram feed / Stories / WhatsApp status).
 * Draws on a <canvas> in the browser so any photo format works and the
 * preview is live. One 1080px-wide grid, fixed outer margin, everything
 * left/right aligned to it — the layout is computed from the bottom up so
 * the photos take whatever room the text leaves.
 *
 * Photos are laid out as a justified mosaic: every split of the photos into
 * rows (or columns) is tried, and the ones that crop the least for that frame
 * rank first. The user can pick another arrangement or any number of photos.
 */
import { EMBLEM_DOT, EMBLEM_SLASHES, EMBLEM_TRIANGLE, LOGO_COLORS, WORDMARK_LETTERS } from '@/components/ui/logo-paths'
import { fmtKm, fmtPrice } from '@/lib/format'

export type PostFormat = 'square' | 'post' | 'story'
export type PostTheme = 'light' | 'dark'
export type PostDesign = 'framed' | 'full' | 'sheet'

export const POST_SIZES: Record<PostFormat, { w: number; h: number; label: string; hint: string }> = {
  square: { w: 1080, h: 1080, label: 'Cuadrado', hint: 'Instagram · Facebook · 1:1' },
  post: { w: 1080, h: 1350, label: 'Vertical', hint: 'Instagram · Facebook · 4:5' },
  story: { w: 1080, h: 1920, label: 'Historia', hint: 'Historias · Estados de WhatsApp · 9:16' },
}

export const POST_DESIGNS: Record<PostDesign, { label: string; hint: string }> = {
  framed: { label: 'Con marco', hint: 'Fotos dentro de los márgenes y el texto debajo.' },
  full: { label: 'Foto completa', hint: 'Las fotos ocupan toda la imagen y el texto va encima, sobre un degradado.' },
  sheet: { label: 'Ficha', hint: 'Fotos de orilla a orilla arriba y un panel con los datos clave en columnas.' },
}

export const MAX_PHOTOS = 8

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
  design: PostDesign
  /** focus 0..1 = where to crop along the axis that overflows */
  photos: { img: HTMLImageElement; focus: number }[]
  /** Index into rankArrangements() for these photos (0 = least cropping) */
  arrangement: number
  showPrice: boolean
  seller: PostSeller | null
  contact: string | null
  site: string
  font: string
  /** Export multiplier (1 = 1080 px wide, 2 = 2160 px) */
  scale?: number
}

interface Palette {
  bg: string; text: string; muted: string; line: string; accent: string
  price: string; word: string; frame: string; markBg: string
}

const THEMES: Record<PostTheme | 'overlay', Palette> = {
  light: {
    bg: '#FAFAF7', text: '#012538', muted: '#5B646B', line: 'rgba(1,37,56,0.14)',
    accent: '#1B768E', price: '#D97B1F', word: LOGO_COLORS.navy, frame: '#ECEFF3', markBg: '#FFFFFF',
  },
  dark: {
    bg: '#012538', text: '#FAFAF7', muted: 'rgba(250,250,247,0.64)', line: 'rgba(250,250,247,0.18)',
    accent: '#7CC3D4', price: '#FB9833', word: LOGO_COLORS.light, frame: '#0B3448', markBg: '#FFFFFF',
  },
  // Text over the photo: always light type on a navy fade
  overlay: {
    bg: '#012538', text: '#FFFFFF', muted: 'rgba(255,255,255,0.76)', line: 'rgba(255,255,255,0.24)',
    accent: '#8FD0DF', price: '#FB9833', word: LOGO_COLORS.light, frame: '#0B3448', markBg: '#FFFFFF',
  },
}

const STATUS_BADGE: Record<string, { label: string; bg: string; fg: string }> = {
  reserved: { label: 'Apartado', bg: '#FAEEDA', fg: '#854F0B' },
  sold: { label: 'Vendido', bg: '#F1EFE8', fg: '#5F5E5A' },
}

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
}

function drawSellerMark(
  ctx: CanvasRenderingContext2D, seller: PostSeller, x: number, y: number, size: number,
  t: Palette, font: string,
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

/* ── mosaic ──────────────────────────────────────────────── */

export interface Rect { x: number; y: number; w: number; h: number }
export interface Arrangement { tiles: Rect[]; score: number }

/** Splits of n into ordered parts, each ≤ maxPart, at most maxParts parts */
function compositions(n: number, maxPart: number, maxParts: number): number[][] {
  if (n === 0) return [[]]
  if (maxParts === 0) return []
  const out: number[][] = []
  for (let p = 1; p <= Math.min(maxPart, n); p++) {
    for (const rest of compositions(n - p, maxPart, maxParts - 1)) out.push([p, ...rest])
  }
  return out
}

/**
 * Justified rows: each row keeps its photos' proportions side by side, then
 * all rows are scaled together to fill the frame height. Every tile ends up
 * cropped by the same factor k, so min(k, 1/k) is the share that survives.
 */
function justifiedRows(f: Rect, aspects: number[], rows: number[], g: number): { tiles: Rect[]; keep: number } {
  const ideal: number[] = []
  let i = 0
  for (const c of rows) {
    const sum = aspects.slice(i, i + c).reduce((a, b) => a + b, 0)
    ideal.push((f.w - (c - 1) * g) / sum)
    i += c
  }
  const k = (f.h - (rows.length - 1) * g) / ideal.reduce((a, b) => a + b, 0)
  const tiles: Rect[] = []
  let y = f.y
  i = 0
  rows.forEach((c, ri) => {
    const row = aspects.slice(i, i + c)
    const sum = row.reduce((a, b) => a + b, 0)
    const usable = f.w - (c - 1) * g
    const h = ri === rows.length - 1 ? f.y + f.h - y : ideal[ri] * k
    let x = f.x
    row.forEach((a, j) => {
      const w = j === c - 1 ? f.x + f.w - x : (usable * a) / sum
      tiles.push({ x, y, w, h })
      x += w + g
    })
    y += h + g
    i += c
  })
  return { tiles, keep: Math.min(k, 1 / k) }
}

const transpose = (r: Rect): Rect => ({ x: r.y, y: r.x, w: r.h, h: r.w })

/** Every arrangement for these photos, best (least cropping) first */
export function rankArrangements(f: Rect, aspects: number[], g: number, limit = 4): Arrangement[] {
  const n = aspects.length
  if (n <= 1) return [{ tiles: [f], score: n ? Math.min(f.w / f.h / aspects[0], aspects[0] / (f.w / f.h)) : 1 }]
  const maxPart = n > 6 ? 4 : 3
  const minSide = 150
  const found: Arrangement[] = []
  const score = (tiles: Rect[], keep: number) => {
    const tiny = tiles.filter((r) => Math.min(r.w, r.h) < minSide).length
    const heroBiggest = tiles.every((r, i) => i === 0 || r.w * r.h <= tiles[0].w * tiles[0].h + 1)
    return keep - (0.25 * tiny) / n + (heroBiggest ? 0.02 : 0)
  }
  for (const parts of compositions(n, maxPart, 4)) {
    const rows = justifiedRows(f, aspects, parts, g)
    found.push({ tiles: rows.tiles, score: score(rows.tiles, rows.keep) })
    if (parts.length > 1 && parts.every((p) => p === 1)) continue // single column = same as rows of 1
    const cols = justifiedRows(transpose(f), aspects.map((a) => 1 / a), parts, g)
    const tiles = cols.tiles.map(transpose)
    found.push({ tiles, score: score(tiles, cols.keep) })
  }
  found.sort((a, b) => b.score - a.score)
  const seen = new Set<string>()
  const out: Arrangement[] = []
  for (const a of found) {
    // Alternatives that crop far more than the best one aren't worth offering
    if (out.length && a.score < out[0].score - 0.25) break
    const key = a.tiles.map((r) => `${Math.round(r.x / 20)},${Math.round(r.y / 20)},${Math.round(r.w / 20)}`).join('|')
    if (seen.has(key)) continue
    seen.add(key)
    out.push(a)
    if (out.length >= limit) break
  }
  return out
}

/** How many photos (1–4) suit this frame best, given their proportions */
export function suggestPhotoCount(frame: Rect, aspects: number[], g = 8) {
  let best = 1
  let bestScore = -Infinity
  for (let n = 1; n <= Math.min(4, aspects.length); n++) {
    const s = (rankArrangements(frame, aspects.slice(0, n), g, 1)[0]?.score ?? 0) + 0.025 * (n - 1)
    if (s > bestScore) { bestScore = s; best = n }
  }
  return best
}

/* ── layout ──────────────────────────────────────────────── */

function typeScale(format: PostFormat) {
  if (format === 'story') {
    return { eyebrow: 22, title: 76, titleMin: 56, specs: 28, price: 64, small: 20, seller: 28, mark: 72, logo: 40, cellLabel: 17, cellValue: 34 }
  }
  if (format === 'square') {
    return { eyebrow: 18, title: 56, titleMin: 42, specs: 23, price: 50, small: 17, seller: 24, mark: 56, logo: 30, cellLabel: 15, cellValue: 27 }
  }
  return { eyebrow: 20, title: 64, titleMin: 48, specs: 26, price: 56, small: 19, seller: 26, mark: 64, logo: 34, cellLabel: 16, cellValue: 30 }
}

/** Everything that depends on measuring text: positions, sizes and the photo frame */
function computeLayout(ctx: CanvasRenderingContext2D, v: PostVehicle, o: Omit<PostOptions, 'photos' | 'seller' | 'arrangement'>) {
  const { w: W, h: H } = POST_SIZES[o.format]
  const story = o.format === 'story'
  const sheet = o.design === 'sheet'
  const F = o.font
  const sz = typeScale(o.format)
  const M = o.format === 'square' ? 64 : 72
  const innerW = W - M * 2
  // Stories: keep clear of Instagram's own header and reply bar
  const top = story ? 190 : M - 8
  const bottom = story ? H - 250 : H - M
  const headerBottom = top + sz.logo
  const footerY = bottom - sz.mark
  const dividerY = footerY - (o.format === 'square' ? 26 : 32)
  const gap = story ? 18 : o.format === 'square' ? 12 : 14

  const showPrice = o.showPrice && !!v.price
  setFont(ctx, 500, sz.price, F, -1.2)
  const priceText = showPrice ? fmtPrice(v.price!) : ''
  const priceW = showPrice ? ctx.measureText(priceText).width : 0
  // Feed formats: price in a right column. Story (narrow): price on its own row below
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
  // The sheet shows year/km/etc. in its grid, so its sub-line is just the version
  const specs = sheet
    ? v.version ?? ''
    : [v.version, v.year ? String(v.year) : null, v.mileage ? fmtKm(v.mileage) : null, v.transmission, v.fuel]
        .filter(Boolean)
        .join('  ·  ')
  const cells = sheet
    ? ([
        ['AÑO', v.year ? String(v.year) : null],
        ['KILOMETRAJE', v.mileage ? fmtKm(v.mileage) : null],
        ['TRANSMISIÓN', v.transmission],
        ['COMBUSTIBLE', v.fuel],
      ].filter(([, val]) => !!val) as [string, string][])
    : []
  const finLine = v.financing ? 'Financiamiento disponible' : ''
  const priceNote = showPrice ? (v.negotiable ? 'MXN · Negociable' : 'MXN') : ''

  const eyebrowRow = !!eyebrow || sidePrice
  let blockH = 0
  if (eyebrowRow) blockH += sz.eyebrow + gap
  blockH += titleLH * titleLines.length
  if (specs) blockH += gap + sz.specs
  if (finLine) blockH += gap + 4 + sz.specs
  if (sidePrice && titleLines.length === 1 && !specs) blockH += gap + sz.small
  if (stackPrice) blockH += gap * 2 + sz.price
  const gridH = cells.length ? sz.cellLabel + 12 + sz.cellValue : 0
  if (cells.length) blockH += gap * 2 + 24 + gridH

  const blockGap = story ? 64 : o.format === 'square' ? 36 : 48
  const blockTop = dividerY - blockGap - blockH

  let frame: Rect
  let tileGap: number
  if (o.design === 'full') {
    frame = { x: 0, y: 0, w: W, h: H }
    tileGap = 6
  } else if (sheet) {
    frame = { x: 0, y: 0, w: W, h: blockTop - blockGap }
    tileGap = 6
  } else {
    const photoY = headerBottom + (story ? 48 : o.format === 'square' ? 28 : 36)
    frame = { x: M, y: photoY, w: innerW, h: blockTop - blockGap - photoY }
    tileGap = 8
  }

  return {
    W, H, M, innerW, top, headerBottom, footerY, dividerY, gap, sz, F,
    showPrice, priceText, priceW, sidePrice, stackPrice, priceNote,
    titleSize, titleLines, titleLH, eyebrow, eyebrowRow, specs, cells, gridH, finLine,
    blockTop, frame, tileGap,
  }
}

let measureCtx: CanvasRenderingContext2D | null = null
/** The exact photo area for these options (for recommendations and layout previews) */
export function getPhotoFrame(v: PostVehicle, o: Omit<PostOptions, 'photos' | 'seller' | 'arrangement'>) {
  measureCtx ??= document.createElement('canvas').getContext('2d')
  const L = computeLayout(measureCtx!, v, o)
  return { frame: L.frame, gap: L.tileGap, w: L.W, h: L.H }
}

/* ── main ────────────────────────────────────────────────── */

export function renderPost(canvas: HTMLCanvasElement, v: PostVehicle, o: PostOptions) {
  const s = o.scale ?? 1
  const { w: W, h: H } = POST_SIZES[o.format]
  canvas.width = W * s
  canvas.height = H * s
  const ctx = canvas.getContext('2d')!
  ctx.setTransform(s, 0, 0, s, 0, 0)
  ctx.imageSmoothingQuality = 'high'

  const L = computeLayout(ctx, v, o)
  const { M, innerW, sz, F, gap } = L
  const full = o.design === 'full'
  const sheet = o.design === 'sheet'
  const t = full ? THEMES.overlay : THEMES[o.theme]

  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  ctx.fillStyle = t.bg
  ctx.fillRect(0, 0, W, H)

  /* Photos */
  const aspects = o.photos.map((p) => p.img.naturalWidth / p.img.naturalHeight)
  const ranked = rankArrangements(L.frame, aspects, L.tileGap, 6)
  const tiles = (ranked[o.arrangement] ?? ranked[0]).tiles
  tiles.forEach((r, i) => {
    ctx.save()
    if (!full && !sheet) { roundRect(ctx, r.x, r.y, r.w, r.h, 4); ctx.clip() }
    ctx.fillStyle = t.frame
    ctx.fillRect(r.x, r.y, r.w, r.h)
    const p = o.photos[i]
    if (p) drawCover(ctx, p.img, r.x, r.y, r.w, r.h, p.focus)
    ctx.restore()
  })

  if (full) {
    // The text sits on a navy fade over the lower photos
    const fadeFrom = L.blockTop - (o.format === 'story' ? 300 : 230)
    const fade = ctx.createLinearGradient(0, fadeFrom, 0, H)
    fade.addColorStop(0, 'rgba(1,37,56,0)')
    fade.addColorStop(0.3, 'rgba(1,37,56,0.62)')
    fade.addColorStop(0.6, 'rgba(1,37,56,0.86)')
    fade.addColorStop(1, 'rgba(1,37,56,0.95)')
    ctx.fillStyle = fade
    ctx.fillRect(0, fadeFrom, W, H - fadeFrom)
  }
  if (full || sheet) {
    // Soft shade behind the logo so it reads on bright skies
    const headFade = ctx.createLinearGradient(0, 0, 0, L.headerBottom + 170)
    headFade.addColorStop(0, 'rgba(1,24,36,0.66)')
    headFade.addColorStop(1, 'rgba(1,24,36,0)')
    ctx.fillStyle = headFade
    ctx.fillRect(0, 0, W, Math.min(L.headerBottom + 170, L.frame.y + L.frame.h))
  }

  /* Header: logo left, location right */
  const onPhoto = full || sheet
  drawLogo(ctx, M, L.top, sz.logo, onPhoto ? LOGO_COLORS.light : t.word)
  setFont(ctx, 500, sz.small, F, 3)
  ctx.fillStyle = onPhoto ? 'rgba(255,255,255,0.82)' : t.muted
  ctx.textAlign = 'right'
  ctx.fillText('AUTOS USADOS · CHIHUAHUA', W - M, L.top + sz.logo / 2 + sz.small * 0.36)
  ctx.textAlign = 'left'

  const badge = STATUS_BADGE[v.status]
  if (badge) {
    const bx = onPhoto ? M : M + 24
    const by = onPhoto ? L.headerBottom + 32 : L.frame.y + 24
    setFont(ctx, 600, sz.small, F, 2.5)
    const label = badge.label.toUpperCase()
    const bw = ctx.measureText(label).width + 36
    const bh = sz.small + 26
    ctx.fillStyle = badge.bg
    roundRect(ctx, bx, by, bw, bh, 3)
    ctx.fill()
    ctx.fillStyle = badge.fg
    ctx.fillText(label, bx + 18, by + bh / 2 + sz.small * 0.36)
  }

  /* Text block */
  let y = L.blockTop
  const eyebrowBaseline = y + sz.eyebrow
  if (L.eyebrow) {
    setFont(ctx, 500, sz.eyebrow, F, 3.5)
    ctx.fillStyle = t.accent
    ctx.fillText(L.eyebrow, M, eyebrowBaseline)
  }
  if (L.eyebrowRow) y += sz.eyebrow + gap
  setFont(ctx, 500, L.titleSize, F, -L.titleSize * 0.02)
  ctx.fillStyle = t.text
  if (full) { ctx.shadowColor = 'rgba(0,0,0,0.28)'; ctx.shadowBlur = 18 }
  L.titleLines.forEach((line, i) => ctx.fillText(line, M, y + L.titleSize * 0.9 + L.titleLH * i))
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  const titleBaseline = y + L.titleSize * 0.9
  y += L.titleLH * L.titleLines.length

  if (L.sidePrice) {
    // Price shares the title's first baseline, right edge of the grid
    setFont(ctx, 500, sz.price, F, -1.2)
    ctx.fillStyle = t.price
    ctx.textAlign = 'right'
    ctx.fillText(L.priceText, W - M, titleBaseline)
    setFont(ctx, 500, sz.small, F, 1.5)
    ctx.fillStyle = t.muted
    ctx.fillText(L.priceNote, W - M, titleBaseline + gap + sz.small + 2)
    setFont(ctx, 500, sz.small, F, 3)
    ctx.fillText('PRECIO', W - M, eyebrowBaseline)
    ctx.textAlign = 'left'
  }

  const specsMax = L.sidePrice ? innerW - Math.max(L.priceW, 200) - 48 : innerW
  if (L.specs) {
    setFont(ctx, 400, sz.specs, F)
    ctx.fillStyle = t.muted
    ctx.fillText(ellipsize(ctx, L.specs, specsMax), M, y + gap + sz.specs * 0.85)
    y += gap + sz.specs
  }
  if (L.finLine) {
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
    ctx.fillText(L.finLine, M + gw + 14, fy)
    y += gap + 4 + sz.specs
  }
  if (L.stackPrice) {
    const py = y + gap * 2 + sz.price * 0.82
    setFont(ctx, 500, sz.price, F, -1.2)
    ctx.fillStyle = t.price
    ctx.fillText(L.priceText, M, py)
    setFont(ctx, 500, sz.small, F, 1.5)
    ctx.fillStyle = t.muted
    ctx.fillText(L.priceNote, M + L.priceW + 18, py)
    y += gap * 2 + sz.price
  }

  if (L.cells.length) {
    // Spec sheet: hairline, then equal columns split by hairlines
    const gy = y + gap * 2
    ctx.fillStyle = t.line
    ctx.fillRect(M, gy, innerW, 1.5)
    const top = gy + 24
    const cw = innerW / L.cells.length
    L.cells.forEach(([label, val], i) => {
      const x = M + cw * i + (i ? 24 : 0)
      if (i) {
        ctx.fillStyle = t.line
        ctx.fillRect(M + cw * i, top, 1.5, L.gridH)
      }
      setFont(ctx, 500, sz.cellLabel, F, 2.5)
      ctx.fillStyle = t.muted
      ctx.fillText(label, x, top + sz.cellLabel)
      setFont(ctx, 500, sz.cellValue, F, -0.5)
      ctx.fillStyle = t.text
      ctx.fillText(ellipsize(ctx, val, cw - (i ? 36 : 12)), x, top + sz.cellLabel + 12 + sz.cellValue * 0.86)
    })
  }

  /* Divider + footer */
  ctx.fillStyle = t.line
  ctx.fillRect(M, L.dividerY, innerW, 1.5)

  const fy = L.footerY
  if (o.seller) {
    drawSellerMark(ctx, o.seller, M, fy, sz.mark, t, F)
    const fx = M + sz.mark + 22
    setFont(ctx, 600, sz.seller, F, -0.3)
    ctx.fillStyle = t.text
    ctx.fillText(ellipsize(ctx, o.seller.name, innerW - sz.mark - 22 - 330), fx, fy + sz.mark / 2 - 4)
    setFont(ctx, 400, sz.small, F)
    ctx.fillStyle = t.muted
    ctx.fillText(o.contact ? `Informes · ${o.contact}` : 'Vendedor', fx, fy + sz.mark / 2 + sz.small + 6)
  } else if (o.contact) {
    setFont(ctx, 400, sz.small, F, 2.5)
    ctx.fillStyle = t.muted
    ctx.fillText('INFORMES', M, fy + sz.mark / 2 - 8)
    setFont(ctx, 600, sz.seller, F)
    ctx.fillStyle = t.text
    ctx.fillText(o.contact, M, fy + sz.mark / 2 + sz.seller - 4)
  }

  ctx.textAlign = 'right'
  setFont(ctx, 400, sz.small, F, 2.5)
  ctx.fillStyle = t.muted
  ctx.fillText('MÁS FOTOS Y DETALLES', W - M, fy + sz.mark / 2 - 8)
  setFont(ctx, 500, sz.seller - 2, F)
  ctx.fillStyle = t.text
  ctx.fillText(o.site, W - M, fy + sz.mark / 2 + sz.seller - 4)
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
