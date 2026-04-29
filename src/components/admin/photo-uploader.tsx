'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/browser'
import { Upload, X, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import type { VehiclePhoto } from '@/lib/supabase/database.types'

interface PhotoUploaderProps {
  vehicleId: string
  initialPhotos?: VehiclePhoto[]
}

export function PhotoUploader({ vehicleId, initialPhotos = [] }: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<VehiclePhoto[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    setError('')
    const supabase = createClient()

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue

      const ext = file.name.split('.').pop()
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const storagePath = `vehicles/${vehicleId}/${filename}`

      const { error: uploadError } = await supabase.storage
        .from('vehicle-photos')
        .upload(storagePath, file, { cacheControl: '3600', upsert: false })

      if (uploadError) { setError(uploadError.message); continue }

      const { data: urlData } = supabase.storage
        .from('vehicle-photos')
        .getPublicUrl(storagePath)

      const isFirst = photos.length === 0
      const { data: newPhoto, error: dbError } = await supabase
        .from('vehicle_photos')
        .insert({
          vehicle_id: vehicleId,
          url: urlData.publicUrl,
          storage_path: storagePath,
          sort_order: photos.length,
          is_cover: isFirst,
          alt_text: null,
        })
        .select()
        .single()

      if (dbError) { setError(dbError.message); continue }
      if (newPhoto) setPhotos((prev) => [...prev, newPhoto])
    }

    setUploading(false)
  }

  async function setCover(photoId: string) {
    const supabase = createClient()
    await supabase.from('vehicle_photos').update({ is_cover: false }).eq('vehicle_id', vehicleId)
    await supabase.from('vehicle_photos').update({ is_cover: true }).eq('id', photoId)
    setPhotos((prev) => prev.map((p) => ({ ...p, is_cover: p.id === photoId })))
  }

  async function deletePhoto(photo: VehiclePhoto) {
    const supabase = createClient()
    await supabase.storage.from('vehicle-photos').remove([photo.storage_path])
    await supabase.from('vehicle_photos').delete().eq('id', photo.id)
    const remaining = photos.filter((p) => p.id !== photo.id)
    if (photo.is_cover && remaining.length > 0) {
      await supabase.from('vehicle_photos').update({ is_cover: true }).eq('id', remaining[0].id)
      remaining[0] = { ...remaining[0], is_cover: true }
    }
    setPhotos(remaining)
  }

  async function movePhoto(index: number, direction: 'left' | 'right') {
    const newPhotos = [...photos]
    const target = direction === 'left' ? index - 1 : index + 1
    if (target < 0 || target >= newPhotos.length) return
    ;[newPhotos[index], newPhotos[target]] = [newPhotos[target], newPhotos[index]]
    const supabase = createClient()
    await Promise.all(
      newPhotos.map((p, i) =>
        supabase.from('vehicle_photos').update({ sort_order: i }).eq('id', p.id),
      ),
    )
    setPhotos(newPhotos)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Drop zone */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex flex-col items-center gap-2 py-8 rounded-[12px] transition-colors cursor-pointer disabled:opacity-60"
        style={{ border: '0.5px dashed var(--gray-line-strong)', background: 'var(--color-surface-alt)' }}
      >
        <Upload size={20} className="text-gray-mid" />
        <span className="text-[13px] text-text-muted">
          {uploading ? 'Subiendo…' : 'Clic para subir fotos'}
        </span>
        <span className="text-[11px] text-gray-mid">JPG, PNG, WEBP</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="text-[13px] text-red-500">{error}</p>}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {photos.map((photo, i) => (
            <div key={photo.id} className="relative group rounded-[8px] overflow-hidden aspect-[4/3]">
              <Image
                src={photo.url}
                alt=""
                fill
                className="object-cover"
              />

              {/* Cover badge */}
              {photo.is_cover && (
                <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-2 py-0.5 rounded-pill text-[10px] font-[500] bg-orange text-white">
                  <Star size={9} fill="currentColor" />
                  Portada
                </div>
              )}

              {/* Controls overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => movePhoto(i, 'left')}
                    className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <ChevronLeft size={14} />
                  </button>
                )}
                {!photo.is_cover && (
                  <button
                    type="button"
                    onClick={() => setCover(photo.id)}
                    className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                    title="Hacer portada"
                  >
                    <Star size={12} />
                  </button>
                )}
                {i < photos.length - 1 && (
                  <button
                    type="button"
                    onClick={() => movePhoto(i, 'right')}
                    className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <ChevronRight size={14} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => deletePhoto(photo)}
                  className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors text-white"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
