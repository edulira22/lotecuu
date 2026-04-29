'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/browser'
import { slugify } from '@/lib/format'
import { AdminField, inputClass, inputStyle } from './admin-field'
import { SellerPhotoUploader } from './seller-photo-uploader'
import type { Seller } from '@/lib/supabase/database.types'

const schema = z.object({
  name: z.string().min(2, 'Requerido'),
  slug: z.string().min(2, 'Requerido').regex(/^[a-z0-9-]+$/, 'Solo letras, números y guiones'),
  whatsapp: z.string().min(10, 'Número inválido'),
  business_name: z.string().optional(),
  phone: z.string().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  google_maps_url: z.string().url('URL inválida').optional().or(z.literal('')),
  active: z.boolean(),
})

type FormData = z.infer<typeof schema>

interface SellerFormProps {
  seller?: Seller
}

export function SellerForm({ seller }: SellerFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')
  const [savedSellerId, setSavedSellerId] = useState<string | null>(seller?.id ?? null)
  const isEdit = !!seller

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: seller?.name ?? '',
      slug: seller?.slug ?? '',
      whatsapp: seller?.whatsapp ?? '',
      business_name: seller?.business_name ?? '',
      phone: seller?.phone ?? '',
      description: seller?.description ?? '',
      address: seller?.address ?? '',
      google_maps_url: seller?.google_maps_url ?? '',
      active: seller?.active ?? true,
    },
  })

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value
    setValue('name', name)
    if (!isEdit) {
      setValue('slug', slugify(name))
    }
  }

  async function onSubmit(data: FormData) {
    setSaving(true)
    setServerError('')
    const supabase = createClient()

    const payload = {
      name: data.name,
      slug: data.slug,
      whatsapp: data.whatsapp,
      business_name: data.business_name || null,
      phone: data.phone || null,
      description: data.description || null,
      address: data.address || null,
      google_maps_url: data.google_maps_url || null,
      active: data.active,
    }

    if (isEdit) {
      const { error } = await supabase
        .from('sellers')
        .update(payload)
        .eq('id', seller.id)
      if (error) { setServerError(error.message); setSaving(false); return }
      router.push('/admin/vendedores')
      router.refresh()
    } else {
      const { data: created, error } = await supabase
        .from('sellers')
        .insert(payload)
        .select()
        .single()
      if (error) { setServerError(error.message); setSaving(false); return }
      setSavedSellerId(created.id)
      setSaving(false)
      return
    }
  }

  return (
    <div className="flex flex-col max-w-2xl">
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-5">
        <AdminField label="Nombre del lote *" error={errors.name?.message}>
          <input
            {...register('name')}
            onChange={handleNameChange}
            className={inputClass}
            style={inputStyle}
            placeholder="Autos García"
          />
        </AdminField>

        <AdminField label="Slug (URL) *" error={errors.slug?.message}>
          <input
            {...register('slug')}
            className={inputClass}
            style={inputStyle}
            placeholder="autos-garcia"
          />
        </AdminField>
      </div>

      <AdminField label="Nombre comercial" error={errors.business_name?.message}>
        <input
          {...register('business_name')}
          className={inputClass}
          style={inputStyle}
          placeholder="García Autos S.A. de C.V."
        />
      </AdminField>

      <div className="grid grid-cols-2 gap-5">
        <AdminField label="WhatsApp *" error={errors.whatsapp?.message}>
          <input
            {...register('whatsapp')}
            className={inputClass}
            style={inputStyle}
            placeholder="6141234567"
          />
        </AdminField>
        <AdminField label="Teléfono" error={errors.phone?.message}>
          <input
            {...register('phone')}
            className={inputClass}
            style={inputStyle}
            placeholder="6141234567"
          />
        </AdminField>
      </div>

      <AdminField label="Descripción" error={errors.description?.message}>
        <textarea
          {...register('description')}
          rows={3}
          className={inputClass}
          style={{ ...inputStyle, resize: 'vertical' }}
          placeholder="Especialistas en pickup y SUV con más de 10 años en Chihuahua."
        />
      </AdminField>

      <AdminField label="Dirección" error={errors.address?.message}>
        <input
          {...register('address')}
          className={inputClass}
          style={inputStyle}
          placeholder="Av. Tecnológico 1234, Chihuahua, Chih."
        />
      </AdminField>

      <AdminField label="Google Maps URL" error={errors.google_maps_url?.message}>
        <input
          {...register('google_maps_url')}
          className={inputClass}
          style={inputStyle}
          placeholder="https://maps.google.com/..."
        />
      </AdminField>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          {...register('active')}
          className="w-4 h-4 accent-orange"
        />
        <span className="text-[14px] font-[500]">Vendedor activo (visible en el sitio)</span>
      </label>

      {serverError && (
        <p className="text-[13px] text-red-500">{serverError}</p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="h-10 px-6 bg-orange text-white rounded-pill text-[13px] font-[500] hover:bg-orange-deep transition-colors disabled:opacity-60 cursor-pointer"
        >
          {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear vendedor'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="h-10 px-5 rounded-pill text-[13px] font-[500] transition-colors"
          style={{ border: '0.5px solid var(--gray-line-strong)' }}
        >
          Cancelar
        </button>
      </div>
    </form>

    {/* Foto de perfil — disponible una vez que el vendedor existe */}
    {savedSellerId && (
      <div
        className="bg-white rounded-[14px] p-6 flex flex-col gap-5 mt-6"
        style={{ border: '0.5px solid var(--gray-line)' }}
      >
        <div className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500]">
          Imágenes del perfil
        </div>
        <div className="flex gap-8 flex-wrap">
          <SellerPhotoUploader
            sellerId={savedSellerId}
            currentUrl={seller?.profile_photo_url}
            field="profile_photo_url"
            label="Foto de perfil"
          />
          <SellerPhotoUploader
            sellerId={savedSellerId}
            currentUrl={seller?.logo_url}
            field="logo_url"
            label="Logo del lote"
          />
        </div>
        {!isEdit && (
          <div className="pt-4" style={{ borderTop: '0.5px solid var(--gray-line)' }}>
            <button
              type="button"
              onClick={() => router.push('/admin/vendedores')}
              className="h-10 px-6 bg-dark text-white rounded-pill text-[13px] font-[500] hover:bg-dark/90 transition-colors cursor-pointer"
            >
              Listo, ver vendedores
            </button>
          </div>
        )}
      </div>
    )}
    </div>
  )
}
