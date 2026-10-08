'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { Copy, Download, Share2, Check, Star } from 'lucide-react'
import { fmtPhone } from '@/lib/format'
import {
  MAX_PHOTOS, POST_DESIGNS, POST_SIZES, buildCaption, getPhotoFrame, rankArrangements, renderPost, suggestPhotoCount,
  type PostDesign, type PostFormat, type PostTheme, type PostVehicle,
} from '@/lib/social-post'

export interface StudioSeller {
  name: string
  logo_url: string | null
  profile_photo_url: string | null
  whatsapp: string | null
  phone: string | null
}

const imageCache = new Map<string, Promise<HTMLImageElement | null>>()
function loadImage(url: string | null | undefined) {
  if (!url) return Promise.resolve(null)
  if (!imageCache.has(url)) {
    imageCache.set(url, new Promise((resolve) => {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => resolve(null)
      img.src = url
    }))
  }
  return imageCache.get(url)!
}

/** Canvas can't read next/font's CSS variable directly — resolve it and wait for the weights */
async function resolveFont() {
  const family = getComputedStyle(document.documentElement).getPropertyValue('--font-manrope').trim() || 'Manrope, sans-serif'
  await Promise.all([400, 500, 600].map((w) => document.fonts.load(`${w} 40px ${family}`).catch(() => null)))
  return family
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.92))
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for browsers without the async clipboard
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  }
}

type Quality = 1 | 2
type FileKind = 'jpg' | 'png'

export function SocialPostStudio({
  vehicle,
  brand,
  model,
  slug,
  photos,
  seller,
}: {
  vehicle: PostVehicle
  brand: string | null
  model: string | null
  slug: string
  photos: string[]
  seller: StudioSeller | null
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [format, setFormat] = useState<PostFormat>('post')
  const [theme, setTheme] = useState<PostTheme>('light')
  const [design, setDesign] = useState<PostDesign>('framed')
  const [images, setImages] = useState<(HTMLImageElement | null)[] | null>(null)
  /** Indices into `photos`, in mosaic order (first = main photo) */
  const [selected, setSelected] = useState<number[]>([0])
  const [manualPick, setManualPick] = useState(false)
  const [active, setActive] = useState(0)
  const [focusMap, setFocusMap] = useState<Record<number, number>>({})
  const [arrangement, setArrangement] = useState(0)
  const [showPrice, setShowPrice] = useState(!!vehicle.price)
  const [showSeller, setShowSeller] = useState(!!seller)
  const [showContact, setShowContact] = useState(false)
  const [quality, setQuality] = useState<Quality>(1)
  const [fileKind, setFileKind] = useState<FileKind>('jpg')
  const [font, setFont] = useState<string | null>(null)
  const [origin, setOrigin] = useState('')
  const [caption, setCaption] = useState('')
  const [captionEdited, setCaptionEdited] = useState(false)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState<'' | 'download' | 'share'>('')
  const [notice, setNotice] = useState('')
  const [canShare, setCanShare] = useState(false)

  const phone = seller?.whatsapp || seller?.phone || null
  const contact = showContact && phone ? fmtPhone(phone) : null
  const url = `${origin}/autos/${slug}`
  const site = origin.replace(/^https?:\/\//, '')

  useEffect(() => {
    setOrigin(window.location.origin)
    resolveFont().then(setFont)
    // Sharing straight to Instagram/WhatsApp only makes sense on phones
    try {
      const touch = window.matchMedia('(pointer: coarse)').matches
      const probe = new File([new Blob()], 'p.jpg', { type: 'image/jpeg' })
      setCanShare(touch && !!navigator.canShare?.({ files: [probe] }))
    } catch { setCanShare(false) }
  }, [])

  useEffect(() => {
    let cancelled = false
    Promise.all(photos.map((p) => loadImage(p))).then((imgs) => { if (!cancelled) setImages(imgs) })
    return () => { cancelled = true }
  }, [photos])

  const base = useMemo(
    () => (font ? { format, theme, design, showPrice, contact, site, font } : null),
    [format, theme, design, showPrice, contact, site, font],
  )
  const frameInfo = useMemo(() => (base ? getPhotoFrame(vehicle, base) : null), [base, vehicle])
  const aspectOf = useCallback((i: number) => images![i]!.naturalWidth / images![i]!.naturalHeight, [images])

  // How many photos suit this format, from their proportions (until the user picks by hand)
  const usable = useMemo(() => (images ?? []).map((img, i) => (img ? i : -1)).filter((i) => i >= 0), [images])
  const suggested = useMemo(() => {
    if (!frameInfo || !usable.length) return 1
    return suggestPhotoCount(frameInfo.frame, usable.map(aspectOf), frameInfo.gap)
  }, [frameInfo, usable, aspectOf])
  useEffect(() => {
    if (manualPick || !usable.length) return
    setSelected(usable.slice(0, suggested))
    setActive(usable[0])
  }, [manualPick, suggested, usable])

  const chosen = useMemo(() => selected.filter((i) => images?.[i]), [selected, images])
  const arrangements = useMemo(() => {
    if (!frameInfo || !chosen.length) return []
    return rankArrangements(frameInfo.frame, chosen.map(aspectOf), frameInfo.gap, 4)
  }, [frameInfo, chosen, aspectOf])
  useEffect(() => { setArrangement(0) }, [chosen, format, design])

  function togglePhoto(i: number) {
    setManualPick(true)
    if (selected.includes(i)) {
      if (selected.length === 1) return
      const next = selected.filter((x) => x !== i)
      setSelected(next)
      if (active === i) setActive(next[0])
      return
    }
    if (selected.length >= MAX_PHOTOS) return
    setSelected([...selected, i])
    setActive(i)
  }

  function makeMain(i: number) {
    setManualPick(true)
    setSelected([i, ...selected.filter((x) => x !== i)])
  }

  const draw = useCallback(async (canvas: HTMLCanvasElement, scale: number) => {
    if (!base || !images) return false
    const [logo, sellerPhoto] = await Promise.all([
      loadImage(showSeller ? seller?.logo_url : null),
      loadImage(showSeller && !seller?.logo_url ? seller?.profile_photo_url : null),
    ])
    renderPost(canvas, vehicle, {
      ...base,
      scale,
      arrangement,
      photos: chosen.map((i) => ({ img: images[i]!, focus: focusMap[i] ?? 0.5 })),
      seller: showSeller && seller ? { name: seller.name, logo, photo: sellerPhoto } : null,
    })
    return true
  }, [base, images, chosen, focusMap, arrangement, showSeller, seller, vehicle])

  // Live preview
  useEffect(() => {
    if (canvasRef.current) void draw(canvasRef.current, 1)
  }, [draw])

  const generatedCaption = useMemo(
    () => origin
      ? buildCaption({ ...vehicle, brand, model }, {
          showPrice, url, contact,
          sellerName: showSeller && seller ? seller.name : null,
        })
      : '',
    [vehicle, brand, model, showPrice, url, contact, showSeller, seller, origin],
  )
  useEffect(() => { if (!captionEdited) setCaption(generatedCaption) }, [generatedCaption, captionEdited])

  const mime = fileKind === 'png' ? 'image/png' : 'image/jpeg'
  const fileName = `${slug}-${format === 'story' ? 'historia' : format === 'square' ? 'cuadrado' : 'post'}.${fileKind}`

  /** Renders a fresh canvas at the export size — the preview stays light */
  async function exportFile() {
    const canvas = document.createElement('canvas')
    if (!(await draw(canvas, quality))) return null
    const blob = await canvasToBlob(canvas, mime)
    return blob ? new File([blob], fileName, { type: mime }) : null
  }

  async function onCopy() {
    const ok = await copyText(caption)
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    }
    return ok
  }

  async function onDownload() {
    setBusy('download')
    setNotice('')
    try {
      const file = await exportFile()
      if (!file) { setNotice('No se pudo generar la imagen. Intenta de nuevo.'); return }
      const href = URL.createObjectURL(file)
      const a = document.createElement('a')
      a.href = href
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.setTimeout(() => URL.revokeObjectURL(href), 4000)
      setNotice(`Listo: ${fileName}`)
    } finally {
      setBusy('')
    }
  }

  async function onShare() {
    setBusy('share')
    setNotice('')
    try {
      const file = await exportFile()
      if (!file) { setNotice('No se pudo generar la imagen. Intenta de nuevo.'); return }
      // Instagram ignores shared text, so leave the caption on the clipboard to paste
      await onCopy()
      await navigator.share({ files: [file] })
    } catch {
      // Share sheet closed — nothing to do
    } finally {
      setBusy('')
    }
  }

  const size = POST_SIZES[format]
  const ready = !!font && !!images

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] gap-6 lg:gap-10 items-start">
      {/* Preview */}
      <div className="lg:sticky lg:top-6 flex flex-col gap-3">
        <div
          className="w-full mx-auto overflow-hidden rounded-[6px] bg-surface-alt"
          style={{
            border: '0.5px solid var(--gray-line-strong)',
            aspectRatio: `${size.w} / ${size.h}`,
            maxWidth: format === 'story' ? 340 : 440,
          }}
        >
          <canvas ref={canvasRef} className="block w-full h-full" aria-label="Vista previa de la publicación" />
        </div>
        <p className="text-[12px] text-text-muted text-center m-0">
          {size.w * quality} × {size.h * quality} px · {size.hint}
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-5">
        <Section title="Formato">
          <Segmented
            value={format}
            onChange={setFormat}
            options={(Object.keys(POST_SIZES) as PostFormat[]).map((k) => ({ value: k, label: POST_SIZES[k].label }))}
          />
        </Section>

        <Section title="Diseño">
          <Segmented
            value={design}
            onChange={setDesign}
            options={(Object.keys(POST_DESIGNS) as PostDesign[]).map((k) => ({ value: k, label: POST_DESIGNS[k].label }))}
          />
          <p className="text-[12px] text-text-muted m-0">{POST_DESIGNS[design].hint}</p>
          {design !== 'full' && (
            <Segmented
              value={theme}
              onChange={setTheme}
              options={[{ value: 'light', label: 'Claro' }, { value: 'dark', label: 'Oscuro' }]}
            />
          )}
        </Section>

        {photos.length > 0 ? (
          <Section title="Fotos">
            <p className="text-[12px] text-text-muted m-0 -mt-1">
              Toca para agregar o quitar (hasta {MAX_PHOTOS}). El número es el orden; la 1 es la principal.
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 pt-1">
              {photos.map((src, i) => {
                const order = selected.indexOf(i)
                const on = order >= 0
                return (
                  <button
                    key={src}
                    type="button"
                    onClick={() => togglePhoto(i)}
                    disabled={images !== null && !images[i]}
                    className="relative shrink-0 w-[76px] h-[56px] overflow-hidden rounded-[4px] transition-opacity disabled:opacity-30"
                    style={{
                      outline: on ? '2px solid var(--color-orange)' : '0.5px solid var(--gray-line-strong)',
                      outlineOffset: on ? 1 : 0,
                      opacity: on ? 1 : 0.7,
                    }}
                    aria-pressed={on}
                    aria-label={on ? `Quitar foto ${i + 1}` : `Agregar foto ${i + 1}`}
                  >
                    <Image src={src} alt="" fill sizes="76px" className="object-cover" />
                    {on && (
                      <span className="absolute top-1 left-1 w-5 h-5 rounded-[3px] bg-orange text-white text-[11px] font-[600] flex items-center justify-center">
                        {order + 1}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            <div className="flex items-center justify-between gap-3 flex-wrap text-[12px] text-text-muted">
              <span>
                Recomendado para este formato: <span className="text-text-base font-[500]">{suggested} {suggested === 1 ? 'foto' : 'fotos'}</span>
                {' '}· llevas {chosen.length}
              </span>
              {manualPick && (
                <button type="button" onClick={() => setManualPick(false)} className="underline underline-offset-2 hover:text-text-base">
                  Usar recomendación
                </button>
              )}
            </div>

            {arrangements.length > 1 && frameInfo && (
              <div className="flex flex-col gap-2 pt-1">
                <span className="text-[12px] text-text-muted">Acomodo — cambia el tamaño de cada foto</span>
                <div className="flex gap-2 flex-wrap">
                  {arrangements.map((a, n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setArrangement(n)}
                      className="flex flex-col items-center gap-1 p-1.5 rounded-[4px] bg-white"
                      style={{ border: n === arrangement ? '1.5px solid var(--color-text-base)' : '0.5px solid var(--gray-line-strong)' }}
                      aria-pressed={n === arrangement}
                      aria-label={n === 0 ? 'Acomodo recomendado' : `Acomodo ${n + 1}`}
                    >
                      <LayoutThumb w={frameInfo.w} h={frameInfo.h} tiles={a.tiles} />
                      <span className="text-[10.5px] text-text-muted">{n === 0 ? 'Recomendado' : `Opción ${n + 1}`}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5 pt-1">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="text-[12px] text-text-muted">Encuadre — mueve la foto si el auto queda cortado</span>
                {chosen.length > 1 && (
                  <div className="flex gap-1 flex-wrap">
                    {chosen.map((i, n) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActive(i)}
                        className="h-6 min-w-6 px-1.5 rounded-[3px] text-[11px] font-[500]"
                        style={{
                          background: active === i ? 'var(--color-text-base)' : 'var(--color-surface-alt)',
                          color: active === i ? 'white' : 'var(--color-text-muted)',
                        }}
                        aria-label={`Encuadre de la foto ${n + 1}`}
                      >
                        {n + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input
                type="range" min={0} max={1} step={0.01} value={focusMap[active] ?? 0.5}
                onChange={(e) => setFocusMap((m) => ({ ...m, [active]: Number(e.target.value) }))}
                className="w-full accent-[var(--color-teal)]"
              />
              {chosen.length > 1 && chosen[0] !== active && (
                <button
                  type="button"
                  onClick={() => makeMain(active)}
                  className="self-start inline-flex items-center gap-1.5 text-[12px] text-text-muted hover:text-text-base"
                >
                  <Star size={12} />
                  Hacer esta foto la principal
                </button>
              )}
            </div>
          </Section>
        ) : (
          <p className="text-[13px] text-text-muted m-0">Este auto no tiene fotos todavía. Súbelas para que la publicación luzca.</p>
        )}

        <Section title="Mostrar">
          <Toggle checked={showPrice} onChange={setShowPrice} disabled={!vehicle.price} label="Precio" />
          <Toggle checked={showSeller} onChange={setShowSeller} disabled={!seller} label="Nombre y logo del vendedor" />
          <Toggle checked={showContact} onChange={setShowContact} disabled={!phone} label={phone ? `Teléfono (${fmtPhone(phone)})` : 'Teléfono'} />
        </Section>

        <Section title="Texto para la publicación">
          <textarea
            value={caption}
            onChange={(e) => { setCaption(e.target.value); setCaptionEdited(true) }}
            rows={9}
            className="w-full px-3 py-2.5 text-[13.5px] leading-relaxed rounded-[4px] bg-white outline-none focus:border-teal"
            style={{ border: '0.5px solid var(--gray-line-strong)', resize: 'vertical' }}
          />
          {captionEdited && (
            <button
              type="button"
              onClick={() => setCaptionEdited(false)}
              className="self-start text-[12px] text-text-muted underline underline-offset-2"
            >
              Volver al texto sugerido
            </button>
          )}
        </Section>

        <Section title="Archivo">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Segmented
              value={String(quality) as '1' | '2'}
              onChange={(v) => setQuality(Number(v) as Quality)}
              options={[{ value: '1', label: 'Normal · 1080 px' }, { value: '2', label: 'Alta · 2160 px' }]}
            />
            <Segmented
              value={fileKind}
              onChange={setFileKind}
              options={[{ value: 'jpg', label: 'JPG' }, { value: 'png', label: 'PNG' }]}
            />
          </div>
          <p className="text-[12px] text-text-muted m-0">
            JPG pesa menos y es lo que usan Instagram y WhatsApp. PNG conserva todo el detalle.
          </p>
        </Section>

        <div className="flex flex-col sm:flex-row gap-2.5">
          {canShare && (
            <button
              type="button"
              onClick={onShare}
              disabled={!!busy || !ready}
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-[4px] bg-orange text-white text-[14px] font-[500] disabled:opacity-60"
            >
              <Share2 size={16} />
              {busy === 'share' ? 'Preparando…' : 'Compartir'}
            </button>
          )}
          <button
            type="button"
            onClick={onDownload}
            disabled={!!busy || !ready}
            className={`inline-flex items-center justify-center gap-2 h-11 px-5 rounded-[4px] text-[14px] font-[500] disabled:opacity-60 ${
              canShare ? 'bg-white text-text-base' : 'bg-orange text-white'
            }`}
            style={canShare ? { border: '0.5px solid var(--gray-line-strong)' } : undefined}
          >
            <Download size={16} />
            {busy === 'download' ? 'Generando…' : 'Descargar imagen'}
          </button>
          <button
            type="button"
            onClick={() => void onCopy()}
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-[4px] bg-white text-text-base text-[14px] font-[500]"
            style={{ border: '0.5px solid var(--gray-line-strong)' }}
          >
            {copied ? <Check size={16} className="text-teal" /> : <Copy size={16} />}
            {copied ? 'Texto copiado' : 'Copiar texto'}
          </button>
        </div>
        <p className="text-[12px] text-text-muted m-0 leading-relaxed" aria-live="polite">
          {notice || (canShare
            ? 'Compartir abre Instagram, WhatsApp y demás apps; el texto queda copiado para pegarlo.'
            : 'Descarga la imagen y súbela a Instagram, Facebook o tu estado de WhatsApp.')}
        </p>
      </div>
    </div>
  )
}

function LayoutThumb({ w, h, tiles }: { w: number; h: number; tiles: { x: number; y: number; w: number; h: number }[] }) {
  const height = 52
  return (
    <svg width={Math.round((height * w) / h)} height={height} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <rect width={w} height={h} fill="var(--color-surface-alt)" />
      {tiles.map((r, i) => (
        <g key={i}>
          <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={i === 0 ? 'var(--color-teal)' : 'var(--color-gray-mid)'} />
          <text
            x={r.x + r.w / 2} y={r.y + r.h / 2} textAnchor="middle" dominantBaseline="central"
            fontSize={Math.min(r.w, r.h) * 0.42} fill="white" fontWeight={600}
          >
            {i + 1}
          </text>
        </g>
      ))}
    </svg>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[6px] p-4 flex flex-col gap-3" style={{ border: '0.5px solid var(--gray-line)' }}>
      <div className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500]">{title}</div>
      {children}
    </div>
  )
}

function Segmented<T extends string>({
  value, onChange, options,
}: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="grid gap-1 p-1 rounded-[4px] bg-surface-alt" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))` }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className="h-9 px-2 rounded-[3px] text-[13px] font-[500] transition-colors truncate"
          style={{
            background: value === o.value ? 'white' : 'transparent',
            color: value === o.value ? 'var(--color-text-base)' : 'var(--color-text-muted)',
            boxShadow: value === o.value ? '0 1px 2px rgba(1,37,56,0.1)' : undefined,
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Toggle({
  checked, onChange, label, disabled,
}: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <label className={`flex items-center gap-2.5 text-[14px] ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={checked && !disabled}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-[var(--color-teal)]"
      />
      {label}
    </label>
  )
}
