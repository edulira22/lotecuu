'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/browser'
import { Upload, X, Star, ChevronLeft, ChevronRight, RefreshCw, Plus } from 'lucide-react'
import { PoseIcon } from '@/components/ui/pose-icon'
import { PHOTO_ANGLES, ANGLE_GROUPS, angleLabel, type PhotoAngle } from '@/lib/photo-angles'
import type { VehiclePhoto } from '@/lib/supabase/database.types'

interface PhotoUploaderProps {
  vehicleId: string
  initialPhotos?: VehiclePhoto[]
}

type Mode = 'guided' | 'free'

/** The poses that make the biggest difference for a buyer. */
const ESSENTIAL = new Set<PhotoAngle>(['tres_cuartos', 'lateral_izq', 'trasera', 'tablero', 'asientos_del'])
const MODE_KEY = 'lotecuu.photoMode'

function friendlyError(message: string) {
  return /angle/i.test(message)
    ? 'Falta activar las posturas de foto en la base de datos (migración 004). Mientras tanto usa el modo Libre.'
    : message
}

export function PhotoUploader({ vehicleId, initialPhotos = [] }: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<VehiclePhoto[]>(
    [...initialPhotos].sort((a, b) => a.sort_order - b.sort_order),
  )
  const [mode, setMode] = useState<Mode>('guided')
  const [busy, setBusy] = useState<string | null>(null) // angle key, 'free', or null
  const [error, setError] = useState('')
  const freeInputRef = useRef<HTMLInputElement>(null)
  const slotInputRef = useRef<HTMLInputElement>(null)
  const pendingAngle = useRef<PhotoAngle | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(MODE_KEY)
      if (saved === 'free' || saved === 'guided') setMode(saved)
    } catch {}
  }, [])

  function changeMode(next: Mode) {
    setMode(next)
    try { localStorage.setItem(MODE_KEY, next) } catch {}
  }

  // First photo per angle fills its slot; anything else is an "extra".
  const { slotPhotos, extras } = useMemo(() => {
    const slots = new Map<string, VehiclePhoto>()
    const rest: VehiclePhoto[] = []
    for (const p of photos) {
      if (p.angle && !slots.has(p.angle)) slots.set(p.angle, p)
      else rest.push(p)
    }
    return { slotPhotos: slots, extras: rest }
  }, [photos])

  const filledSlots = PHOTO_ANGLES.filter((a) => slotPhotos.has(a.key)).length

  /* ── Data operations ─────────────────────────────────────── */

  async function uploadOne(file: File, angle: PhotoAngle | null, makeCover: boolean, order: number) {
    const supabase = createClient()
    const ext = file.name.split('.').pop() ?? 'jpg'
    const storagePath = `vehicles/${vehicleId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('vehicle-photos')
      .upload(storagePath, file, { cacheControl: '3600', upsert: false })
    if (upErr) throw new Error(upErr.message)

    const { data: urlData } = supabase.storage.from('vehicle-photos').getPublicUrl(storagePath)

    const { data, error: dbErr } = await supabase
      .from('vehicle_photos')
      .insert({
        vehicle_id: vehicleId,
        url: urlData.publicUrl,
        storage_path: storagePath,
        sort_order: order,
        is_cover: makeCover,
        alt_text: null,
        ...(angle ? { angle } : {}),
      })
      .select()
      .single()

    if (dbErr) {
      await supabase.storage.from('vehicle-photos').remove([storagePath])
      throw new Error(dbErr.message)
    }
    return data as VehiclePhoto
  }

  async function removePhoto(photo: VehiclePhoto, list: VehiclePhoto[]) {
    const supabase = createClient()
    await supabase.storage.from('vehicle-photos').remove([photo.storage_path])
    await supabase.from('vehicle_photos').delete().eq('id', photo.id)
    const remaining = list.filter((p) => p.id !== photo.id)
    if (photo.is_cover && remaining.length > 0) {
      await supabase.from('vehicle_photos').update({ is_cover: true }).eq('id', remaining[0].id)
      remaining[0] = { ...remaining[0], is_cover: true }
    }
    return remaining
  }

  async function handleFreeFiles(files: FileList | null) {
    if (!files?.length) return
    setBusy('free'); setError('')
    let list = photos
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      try {
        const order = list.reduce((m, p) => Math.max(m, p.sort_order), -1) + 1
        const created = await uploadOne(file, null, list.length === 0, order)
        list = [...list, created]
        setPhotos(list)
      } catch (e) {
        setError(friendlyError((e as Error).message))
      }
    }
    setBusy(null)
  }

  async function handleSlotFile(angle: PhotoAngle, file: File | undefined) {
    if (!file || !file.type.startsWith('image/')) return
    setBusy(angle); setError('')
    try {
      const previous = slotPhotos.get(angle)
      const order = photos.reduce((m, p) => Math.max(m, p.sort_order), -1) + 1
      const created = await uploadOne(file, angle, photos.length === 0 || !!previous?.is_cover, order)
      let list = [...photos, created]
      if (previous) {
        // Replace: drop the old one but keep the new one as cover if the old was
        list = await removePhoto({ ...previous, is_cover: false }, list)
      }
      setPhotos(list)
    } catch (e) {
      setError(friendlyError((e as Error).message))
    }
    setBusy(null)
  }

  async function deletePhoto(photo: VehiclePhoto) {
    setPhotos(await removePhoto(photo, photos))
  }

  async function setCover(photoId: string) {
    const supabase = createClient()
    await supabase.from('vehicle_photos').update({ is_cover: false }).eq('vehicle_id', vehicleId)
    await supabase.from('vehicle_photos').update({ is_cover: true }).eq('id', photoId)
    setPhotos((prev) => prev.map((p) => ({ ...p, is_cover: p.id === photoId })))
  }

  async function setAngle(photo: VehiclePhoto, angle: string) {
    setError('')
    const supabase = createClient()
    const value = angle || null
    const { error: e } = await supabase.from('vehicle_photos').update({ angle: value }).eq('id', photo.id)
    if (e) { setError(friendlyError(e.message)); return }
    setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, angle: value } : p)))
  }

  async function movePhoto(index: number, direction: -1 | 1) {
    const next = [...photos]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    const supabase = createClient()
    await Promise.all(next.map((p, i) => supabase.from('vehicle_photos').update({ sort_order: i }).eq('id', p.id)))
    setPhotos(next.map((p, i) => ({ ...p, sort_order: i })))
  }

  function pickForSlot(angle: PhotoAngle) {
    pendingAngle.current = angle
    slotInputRef.current?.click()
  }

  /* ── UI ──────────────────────────────────────────────────── */

  return (
    <div className="flex flex-col gap-5">
      {/* Mode switch */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex p-1 rounded-pill" style={{ background: 'var(--color-surface-alt)' }}>
          {([
            ['guided', 'Guiada'],
            ['free', 'Libre'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => changeMode(key)}
              className="px-4 py-1.5 rounded-pill text-[12px] font-[500] transition-colors"
              style={mode === key ? { background: '#012538', color: '#fff' } : { color: 'var(--color-text-muted)' }}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="text-[12px] text-text-muted">
          {mode === 'guided'
            ? `${filledSlots} de ${PHOTO_ANGLES.length} posturas · ${photos.length} fotos`
            : `${photos.length} fotos`}
        </span>
      </div>

      {mode === 'guided' && (
        <p className="text-[12px] text-text-muted leading-relaxed -mt-2">
          Sube una foto por postura — así el comprador ve el auto completo. Las marcadas con{' '}
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange align-middle" /> son las más
          importantes. Ninguna es obligatoria.
        </p>
      )}

      {error && <p className="text-[13px] text-red-500">{error}</p>}

      {/* ── Guided ── */}
      {mode === 'guided' && (
        <div className="flex flex-col gap-6">
          {ANGLE_GROUPS.map((group) => {
            const angles = PHOTO_ANGLES.filter((a) => a.group === group.key)
            const done = angles.filter((a) => slotPhotos.has(a.key)).length
            return (
              <div key={group.key} className="flex flex-col gap-2.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500]">{group.label}</span>
                  <span className="text-[11px] text-text-muted">{done} / {angles.length}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {angles.map((a) => (
                    <SlotTile
                      key={a.key}
                      angle={a.key}
                      label={a.label}
                      essential={ESSENTIAL.has(a.key)}
                      photo={slotPhotos.get(a.key)}
                      busy={busy === a.key}
                      onPick={() => pickForSlot(a.key)}
                      onDropFile={(f) => handleSlotFile(a.key, f)}
                      onDelete={(p) => deletePhoto(p)}
                      onCover={(p) => setCover(p.id)}
                    />
                  ))}
                </div>
              </div>
            )
          })}

          {/* Extras */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500]">Más fotos</span>
              <span className="text-[11px] text-text-muted">{extras.length}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {extras.map((p) => (
                <PhotoTile key={p.id} photo={p} onDelete={() => deletePhoto(p)} onCover={() => setCover(p.id)} />
              ))}
              <button
                type="button"
                onClick={() => freeInputRef.current?.click()}
                disabled={busy !== null}
                className="aspect-[4/3] rounded-[4px] flex flex-col items-center justify-center gap-1.5 text-text-muted hover:text-text-base transition-colors disabled:opacity-60"
                style={{ border: '0.5px dashed var(--gray-line-strong)', background: 'var(--color-surface-alt)' }}
              >
                <Plus size={16} />
                <span className="text-[11px] font-[500]">{busy === 'free' ? 'Subiendo…' : 'Agregar fotos'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Free ── */}
      {mode === 'free' && (
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => freeInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFreeFiles(e.dataTransfer.files) }}
            disabled={busy !== null}
            className="flex flex-col items-center gap-2 py-8 rounded-[6px] transition-colors cursor-pointer disabled:opacity-60"
            style={{ border: '0.5px dashed var(--gray-line-strong)', background: 'var(--color-surface-alt)' }}
          >
            <Upload size={20} className="text-gray-mid" />
            <span className="text-[13px] text-text-muted">
              {busy === 'free' ? 'Subiendo…' : 'Clic o arrastra para subir varias fotos'}
            </span>
            <span className="text-[11px] text-gray-mid">JPG, PNG, WEBP</span>
          </button>

          {photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {photos.map((p, i) => (
                <div key={p.id} className="flex flex-col gap-1.5">
                  <PhotoTile
                    photo={p}
                    onDelete={() => deletePhoto(p)}
                    onCover={() => setCover(p.id)}
                    onLeft={i > 0 ? () => movePhoto(i, -1) : undefined}
                    onRight={i < photos.length - 1 ? () => movePhoto(i, 1) : undefined}
                  />
                  <select
                    value={p.angle ?? ''}
                    onChange={(e) => setAngle(p, e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg text-[12px] outline-none cursor-pointer bg-white"
                    style={{ border: '0.5px solid var(--gray-line-strong)' }}
                    aria-label="Postura de la foto"
                  >
                    <option value="">Sin postura</option>
                    {ANGLE_GROUPS.map((g) => (
                      <optgroup key={g.key} label={g.label}>
                        {PHOTO_ANGLES.filter((a) => a.group === g.key).map((a) => (
                          <option key={a.key} value={a.key}>{a.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <input
        ref={freeInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => { handleFreeFiles(e.target.files); e.target.value = '' }}
      />
      <input
        ref={slotInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const angle = pendingAngle.current
          if (angle) handleSlotFile(angle, e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}

/* ── Tiles ─────────────────────────────────────────────────── */

function SlotTile({
  angle, label, essential, photo, busy, onPick, onDropFile, onDelete, onCover,
}: {
  angle: PhotoAngle
  label: string
  essential: boolean
  photo?: VehiclePhoto
  busy: boolean
  onPick: () => void
  onDropFile: (f: File | undefined) => void
  onDelete: (p: VehiclePhoto) => void
  onCover: (p: VehiclePhoto) => void
}) {
  const [over, setOver] = useState(false)
  const dropProps = {
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setOver(true) },
    onDragLeave: () => setOver(false),
    onDrop: (e: React.DragEvent) => { e.preventDefault(); setOver(false); onDropFile(e.dataTransfer.files[0]) },
  }

  if (!photo) {
    return (
      <button
        type="button"
        onClick={onPick}
        disabled={busy}
        {...dropProps}
        className="group relative aspect-[4/3] rounded-[4px] flex flex-col items-center justify-center gap-1 px-2 transition-colors disabled:opacity-60"
        style={{
          border: `0.5px dashed ${over ? 'var(--color-orange)' : 'var(--gray-line-strong)'}`,
          background: over ? 'var(--color-orange-soft)' : 'var(--color-surface-alt)',
        }}
      >
        {essential && <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-orange" />}
        <PoseIcon angle={angle} size={58} className="text-gray-mid group-hover:text-teal transition-colors" />
        <span className="text-[11px] font-[500] text-text-base text-center leading-tight">{label}</span>
        <span className="text-[10px] text-text-muted">{busy ? 'Subiendo…' : 'Subir foto'}</span>
      </button>
    )
  }

  return (
    <div {...dropProps} className="group relative aspect-[4/3] rounded-[4px] overflow-hidden" style={{ background: '#0E1218' }}>
      <Image src={photo.url} alt={label} fill className="object-cover" sizes="(max-width: 640px) 50vw, 220px" />
      <div className="absolute inset-x-0 bottom-0 px-2 py-1.5 text-[10px] font-[500] text-white" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)' }}>
        {label}
      </div>
      {photo.is_cover && <CoverBadge />}
      {(busy || over) && (
        <div className="absolute inset-0 flex items-center justify-center text-[11px] text-white bg-black/50">
          {busy ? 'Subiendo…' : 'Soltar para reemplazar'}
        </div>
      )}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
        {!photo.is_cover && <IconBtn title="Hacer portada" onClick={() => onCover(photo)}><Star size={12} /></IconBtn>}
        <IconBtn title="Reemplazar" onClick={onPick}><RefreshCw size={12} /></IconBtn>
        <IconBtn title="Quitar" danger onClick={() => onDelete(photo)}><X size={12} /></IconBtn>
      </div>
    </div>
  )
}

function PhotoTile({
  photo, onDelete, onCover, onLeft, onRight,
}: {
  photo: VehiclePhoto
  onDelete: () => void
  onCover: () => void
  onLeft?: () => void
  onRight?: () => void
}) {
  const label = angleLabel(photo.angle)
  return (
    <div className="group relative aspect-[4/3] rounded-[4px] overflow-hidden" style={{ background: '#0E1218' }}>
      <Image src={photo.url} alt={label ?? ''} fill className="object-cover" sizes="(max-width: 640px) 50vw, 220px" />
      {photo.is_cover && <CoverBadge />}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
        {onLeft && <IconBtn title="Mover a la izquierda" onClick={onLeft}><ChevronLeft size={14} /></IconBtn>}
        {!photo.is_cover && <IconBtn title="Hacer portada" onClick={onCover}><Star size={12} /></IconBtn>}
        {onRight && <IconBtn title="Mover a la derecha" onClick={onRight}><ChevronRight size={14} /></IconBtn>}
        <IconBtn title="Quitar" danger onClick={onDelete}><X size={12} /></IconBtn>
      </div>
    </div>
  )
}

function CoverBadge() {
  return (
    <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-2 py-0.5 rounded-pill text-[10px] font-[500] bg-orange text-white">
      <Star size={9} fill="currentColor" />
      Portada
    </div>
  )
}

function IconBtn({ children, title, onClick, danger }: { children: React.ReactNode; title: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`w-7 h-7 rounded-[4px] flex items-center justify-center transition-colors ${danger ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white/90 hover:bg-white'}`}
    >
      {children}
    </button>
  )
}
