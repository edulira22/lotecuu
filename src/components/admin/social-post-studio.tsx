'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { Copy, Download, Share2, Check } from 'lucide-react'
import { fmtPhone } from '@/lib/format'
import {
  POST_SIZES, buildCaption, renderPost,
  type PostFormat, type PostTheme, type PostVehicle,
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
  const [photoIdx, setPhotoIdx] = useState(0)
  const [focus, setFocus] = useState(0.5)
  const [showPrice, setShowPrice] = useState(!!vehicle.price)
  const [showSeller, setShowSeller] = useState(!!seller)
  const [showContact, setShowContact] = useState(false)
  const [font, setFont] = useState<string | null>(null)
  const [origin, setOrigin] = useState('')
  const [caption, setCaption] = useState('')
  const [captionEdited, setCaptionEdited] = useState(false)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [canShare, setCanShare] = useState(false)

  const phone = seller?.whatsapp || seller?.phone || null
  const contact = showContact && phone ? fmtPhone(phone) : null
  const url = `${origin}/autos/${slug}`
  const site = origin.replace(/^https?:\/\//, '')

  useEffect(() => {
    setOrigin(window.location.origin)
    resolveFont().then(setFont)
    try {
      const probe = new File([new Blob()], 'p.jpg', { type: 'image/jpeg' })
      setCanShare(!!navigator.canShare?.({ files: [probe] }))
    } catch { setCanShare(false) }
  }, [])

  // Live preview
  useEffect(() => {
    if (!font || !origin) return
    let cancelled = false
    Promise.all([
      loadImage(photos[photoIdx]),
      loadImage(showSeller ? seller?.logo_url : null),
      loadImage(showSeller && !seller?.logo_url ? seller?.profile_photo_url : null),
    ]).then(([photo, logo, sellerPhoto]) => {
      if (cancelled || !canvasRef.current) return
      renderPost(canvasRef.current, vehicle, {
        format, theme, photo, focus, showPrice, font, contact, site,
        seller: showSeller && seller ? { name: seller.name, logo, photo: sellerPhoto } : null,
      })
    })
    return () => { cancelled = true }
  }, [font, origin, format, theme, photoIdx, focus, showPrice, showSeller, contact, site, photos, seller, vehicle])

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

  function toBlob() {
    return new Promise<Blob | null>((resolve) => canvasRef.current?.toBlob(resolve, 'image/jpeg', 0.92) ?? resolve(null))
  }
  const fileName = `${slug}-${format === 'post' ? 'post' : 'historia'}.jpg`

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(caption)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {}
  }

  async function download() {
    const blob = await toBlob()
    if (!blob) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = fileName
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  async function share() {
    setBusy(true)
    try {
      const blob = await toBlob()
      if (!blob) return
      // Instagram ignores shared text, so leave the caption on the clipboard to paste
      await copyCaption()
      await navigator.share({ files: [new File([blob], fileName, { type: 'image/jpeg' })], text: caption })
    } catch {
      // User closed the share sheet — nothing to do
    } finally {
      setBusy(false)
    }
  }

  const size = POST_SIZES[format]

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
        <p className="text-[12px] text-text-muted text-center m-0">{size.w} × {size.h} px · {size.hint}</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-5">
        <Section title="Formato">
          <Segmented
            value={format}
            onChange={(v) => { setFormat(v); setFocus(0.5) }}
            options={(Object.keys(POST_SIZES) as PostFormat[]).map((k) => ({ value: k, label: POST_SIZES[k].label }))}
          />
          <Segmented
            value={theme}
            onChange={setTheme}
            options={[{ value: 'light', label: 'Claro' }, { value: 'dark', label: 'Oscuro' }]}
          />
        </Section>

        {photos.length > 0 ? (
          <Section title="Foto">
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {photos.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => { setPhotoIdx(i); setFocus(0.5) }}
                  className="relative shrink-0 w-[76px] h-[56px] overflow-hidden rounded-[4px] transition-opacity"
                  style={{
                    outline: i === photoIdx ? '2px solid var(--color-orange)' : '0.5px solid var(--gray-line-strong)',
                    outlineOffset: i === photoIdx ? 1 : 0,
                    opacity: i === photoIdx ? 1 : 0.72,
                  }}
                  aria-label={`Usar foto ${i + 1}`}
                >
                  <Image src={src} alt="" fill sizes="76px" className="object-cover" />
                </button>
              ))}
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] text-text-muted">Encuadre — mueve la foto si el auto queda cortado</span>
              <input
                type="range" min={0} max={1} step={0.01} value={focus}
                onChange={(e) => setFocus(Number(e.target.value))}
                className="w-full accent-[var(--color-teal)]"
              />
            </label>
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

        <div className="flex flex-col sm:flex-row gap-2.5">
          {canShare && (
            <button
              type="button"
              onClick={share}
              disabled={busy || !font}
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-[4px] bg-orange text-white text-[14px] font-[500] disabled:opacity-60"
            >
              <Share2 size={16} />
              Compartir en Instagram o WhatsApp
            </button>
          )}
          <button
            type="button"
            onClick={download}
            disabled={!font}
            className={`inline-flex items-center justify-center gap-2 h-11 px-5 rounded-[4px] text-[14px] font-[500] disabled:opacity-60 ${
              canShare ? 'bg-white text-text-base' : 'bg-orange text-white'
            }`}
            style={canShare ? { border: '0.5px solid var(--gray-line-strong)' } : undefined}
          >
            <Download size={16} />
            Descargar imagen
          </button>
          <button
            type="button"
            onClick={copyCaption}
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-[4px] bg-white text-text-base text-[14px] font-[500]"
            style={{ border: '0.5px solid var(--gray-line-strong)' }}
          >
            {copied ? <Check size={16} className="text-teal" /> : <Copy size={16} />}
            {copied ? 'Texto copiado' : 'Copiar texto'}
          </button>
        </div>
        <p className="text-[12px] text-text-muted m-0 leading-relaxed">
          {canShare
            ? 'Al compartir, el texto queda copiado: pégalo como descripción en Instagram.'
            : 'Desde el celular aparece el botón para compartir directo a Instagram o WhatsApp.'}
        </p>
      </div>
    </div>
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
          className="h-9 px-3 rounded-[3px] text-[13px] font-[500] transition-colors"
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
