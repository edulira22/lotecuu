'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/browser'
import { Upload, X } from 'lucide-react'

interface SellerPhotoUploaderProps {
  sellerId: string
  currentUrl?: string | null
  field: 'profile_photo_url' | 'logo_url'
  label: string
}

export function SellerPhotoUploader({
  sellerId,
  currentUrl,
  field,
  label,
}: SellerPhotoUploaderProps) {
  const [url, setUrl] = useState<string | null>(currentUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File | null | undefined) {
    if (!file || !file.type.startsWith('image/')) return
    setUploading(true)
    setError('')
    const supabase = createClient()

    const ext = file.name.split('.').pop() ?? 'jpg'
    const storagePath = `sellers/${sellerId}/${field}.${ext}`

    // Upsert — replace existing
    const { error: uploadError } = await supabase.storage
      .from('seller-photos')
      .upload(storagePath, file, { cacheControl: '3600', upsert: true })

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('seller-photos')
      .getPublicUrl(storagePath)

    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

    const { error: dbError } = await supabase
      .from('sellers')
      .update({ [field]: urlData.publicUrl })
      .eq('id', sellerId)

    if (dbError) {
      setError(dbError.message)
      setUploading(false)
      return
    }

    setUrl(publicUrl)
    setUploading(false)
  }

  async function removePhoto() {
    const supabase = createClient()
    await supabase.from('sellers').update({ [field]: null }).eq('id', sellerId)
    setUrl(null)
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500]">{label}</p>

      {url ? (
        <div className="relative w-24 h-24 rounded-[12px] overflow-hidden group" style={{ border: '0.5px solid var(--gray-line)' }}>
          <Image src={url} alt={label} fill className="object-cover" />
          <button
            type="button"
            onClick={removePhoto}
            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
            aria-label="Eliminar foto"
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-24 h-24 rounded-[12px] flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-60"
          style={{ border: '0.5px dashed var(--gray-line-strong)', background: 'var(--surface-alt)' }}
        >
          <Upload size={18} className="text-gray-mid" />
          <span className="text-[11px] text-text-muted">{uploading ? 'Subiendo…' : 'Subir'}</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {error && <p className="text-[12px] text-red-500">{error}</p>}
    </div>
  )
}
