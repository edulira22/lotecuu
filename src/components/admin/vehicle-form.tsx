'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/browser'
import { slugify } from '@/lib/format'
import { AdminField, inputClass, inputStyle } from './admin-field'
import { PhotoUploader } from './photo-uploader'
import type { Vehicle, Seller, VehiclePhoto } from '@/lib/supabase/database.types'

const schema = z.object({
  seller_id: z.string().uuid('Selecciona un vendedor'),
  title: z.string().min(3, 'Requerido'),
  slug: z.string().min(3, 'Requerido'),
  brand: z.string().optional(),
  model: z.string().optional(),
  version: z.string().optional(),
  year: z.coerce.number().int().min(1950).max(2030).optional().or(z.literal('')),
  price: z.coerce.number().min(0).optional().or(z.literal('')),
  mileage: z.coerce.number().min(0).optional().or(z.literal('')),
  transmission: z.string().optional(),
  fuel: z.string().optional(),
  body_type: z.string().optional(),
  color: z.string().optional(),
  condition: z.string().optional(),
  doors: z.coerce.number().int().min(1).max(10).optional().or(z.literal('')),
  cylinders: z.coerce.number().int().min(1).max(20).optional().or(z.literal('')),
  drive_type: z.string().optional(),
  origin: z.enum(['', 'nacional', 'importado']),
  has_debt: z.enum(['', 'false', 'true']),
  description: z.string().optional(),
  status: z.enum(['draft', 'published', 'hidden', 'reserved', 'sold']),
  featured: z.boolean(),
  negotiable: z.boolean(),
  accepts_trade: z.boolean(),
  financing: z.boolean(),
  single_owner: z.boolean(),
})

type FormData = z.infer<typeof schema>

interface VehicleFormProps {
  sellers: Seller[]
  vehicle?: Vehicle
  photos?: VehiclePhoto[]
}

const selectClass = `${inputClass} cursor-pointer`

export function VehicleForm({ sellers, vehicle, photos = [] }: VehicleFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')
  const [savedVehicleId, setSavedVehicleId] = useState<string | null>(vehicle?.id ?? null)
  const isEdit = !!vehicle

  // Price display state (formatted) — separate from raw form value
  const [priceDisplay, setPriceDisplay] = useState(
    vehicle?.price ? '$' + vehicle.price.toLocaleString('es-MX') : '',
  )

  const YEARS = Array.from({ length: new Date().getFullYear() - 1979 + 2 }, (_, i) => new Date().getFullYear() + 1 - i)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      seller_id: vehicle?.seller_id ?? '',
      title: vehicle?.title ?? '',
      slug: vehicle?.slug ?? '',
      brand: vehicle?.brand ?? '',
      model: vehicle?.model ?? '',
      version: vehicle?.version ?? '',
      year: vehicle?.year ?? '',
      price: vehicle?.price ?? '',
      mileage: vehicle?.mileage ?? '',
      transmission: vehicle?.transmission ?? '',
      fuel: vehicle?.fuel ?? '',
      body_type: vehicle?.body_type ?? '',
      color: vehicle?.color ?? '',
      condition: vehicle?.condition ?? '',
      doors: vehicle?.doors ?? '',
      cylinders: vehicle?.cylinders ?? '',
      drive_type: vehicle?.drive_type ?? '',
      origin: (vehicle?.origin ?? '') as '' | 'nacional' | 'importado',
      has_debt: (vehicle?.has_debt === true ? 'true' : vehicle?.has_debt === false ? 'false' : '') as '' | 'false' | 'true',
      description: vehicle?.description ?? '',
      status: (vehicle?.status as FormData['status']) ?? 'draft',
      featured: vehicle?.featured ?? false,
      negotiable: vehicle?.negotiable ?? false,
      accepts_trade: vehicle?.accepts_trade ?? false,
      financing: vehicle?.financing ?? false,
      single_owner: vehicle?.single_owner ?? false,
    },
  })

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const title = e.target.value
    setValue('title', title)
    if (!isEdit) setValue('slug', slugify(title))
  }

  async function onSubmit(data: FormData) {
    setSaving(true)
    setServerError('')
    const supabase = createClient()

    const payload = {
      seller_id: data.seller_id,
      title: data.title,
      slug: data.slug,
      brand: data.brand || null,
      model: data.model || null,
      version: data.version || null,
      year: data.year !== '' ? Number(data.year) : null,
      price: data.price !== '' ? Number(data.price) : null,
      mileage: data.mileage !== '' ? Number(data.mileage) : null,
      transmission: data.transmission || null,
      fuel: data.fuel || null,
      body_type: data.body_type || null,
      color: data.color || null,
      condition: data.condition || null,
      doors: data.doors !== '' ? Number(data.doors) : null,
      cylinders: data.cylinders !== '' ? Number(data.cylinders) : null,
      drive_type: data.drive_type || null,
      origin: (data.origin || null) as 'nacional' | 'importado' | null,
      has_debt: data.has_debt === 'true' ? true : data.has_debt === 'false' ? false : null,
      single_owner: data.single_owner,
      description: data.description || null,
      status: data.status,
      featured: data.featured,
      negotiable: data.negotiable,
      accepts_trade: data.accepts_trade,
      financing: data.financing,
    }

    if (isEdit) {
      const { error } = await supabase.from('vehicles').update(payload).eq('id', vehicle.id)
      if (error) { setServerError(error.message); setSaving(false); return }
    } else {
      const { data: created, error } = await supabase
        .from('vehicles')
        .insert(payload)
        .select()
        .single()
      if (error) { setServerError(error.message); setSaving(false); return }
      setSavedVehicleId(created.id)
      setSaving(false)
      return
    }

    router.push('/admin/inventario')
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* Vendedor + estado */}
        <div className="bg-white rounded-[14px] p-6 flex flex-col gap-5" style={{ border: '0.5px solid var(--gray-line)' }}>
          <div className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500]">Publicación</div>

          <div className="grid grid-cols-2 gap-5">
            <AdminField label="Vendedor *" error={errors.seller_id?.message}>
              <select {...register('seller_id')} className={selectClass} style={inputStyle}>
                <option value="">Seleccionar…</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </AdminField>

            <AdminField label="Estado" error={errors.status?.message}>
              <select {...register('status')} className={selectClass} style={inputStyle}>
                <option value="draft">Borrador</option>
                <option value="published">Publicado</option>
                <option value="hidden">Oculto</option>
                <option value="reserved">Apartado</option>
                <option value="sold">Vendido</option>
              </select>
            </AdminField>
          </div>

          <div className="flex gap-6 flex-wrap">
            {([
              ['featured', 'Destacado'],
              ['negotiable', 'Precio negociable'],
              ['accepts_trade', 'Acepta auto a cuenta'],
              ['financing', 'Tiene financiamiento'],
              ['single_owner', 'Único dueño'],
            ] as const).map(([field, label]) => (
              <label key={field} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register(field)} className="w-4 h-4 accent-orange" />
                <span className="text-[13px] font-[500]">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Datos del auto */}
        <div className="bg-white rounded-[14px] p-6 flex flex-col gap-5" style={{ border: '0.5px solid var(--gray-line)' }}>
          <div className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500]">Datos del vehículo</div>

          <AdminField label="Título *" error={errors.title?.message}>
            <input
              {...register('title')}
              onChange={handleTitleChange}
              className={inputClass}
              style={inputStyle}
              placeholder="Toyota Hilux 2022 4x4 TRD"
            />
          </AdminField>

          <AdminField label="Slug (URL)" error={errors.slug?.message}>
            <input {...register('slug')} className={inputClass} style={inputStyle} placeholder="toyota-hilux-2022-4x4-trd" />
          </AdminField>

          <div className="grid grid-cols-3 gap-4">
            <AdminField label="Marca" error={errors.brand?.message}>
              <input {...register('brand')} className={inputClass} style={inputStyle} placeholder="Toyota" />
            </AdminField>
            <AdminField label="Modelo" error={errors.model?.message}>
              <input {...register('model')} className={inputClass} style={inputStyle} placeholder="Hilux" />
            </AdminField>
            <AdminField label="Versión" error={errors.version?.message}>
              <input {...register('version')} className={inputClass} style={inputStyle} placeholder="TRD Sport" />
            </AdminField>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <AdminField label="Año" error={errors.year?.message}>
              <select {...register('year')} className={selectClass} style={inputStyle}>
                <option value="">—</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </AdminField>
            <AdminField label="Precio (MXN)" error={errors.price?.message}>
              <input
                type="text"
                inputMode="numeric"
                value={priceDisplay}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '')
                  setPriceDisplay(raw ? '$' + parseInt(raw, 10).toLocaleString('es-MX') : '')
                  setValue('price', raw ? parseInt(raw, 10) : '')
                }}
                className={inputClass}
                style={inputStyle}
                placeholder="$195,000"
              />
            </AdminField>
            <AdminField label="Kilometraje" error={errors.mileage?.message}>
              <input {...register('mileage')} type="number" className={inputClass} style={inputStyle} placeholder="42000" />
            </AdminField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <AdminField label="Transmisión">
              <select {...register('transmission')} className={selectClass} style={inputStyle}>
                <option value="">—</option>
                <option value="Automático">Automático</option>
                <option value="Manual">Manual</option>
                <option value="CVT">CVT</option>
              </select>
            </AdminField>
            <AdminField label="Combustible">
              <select {...register('fuel')} className={selectClass} style={inputStyle}>
                <option value="">—</option>
                <option value="Gasolina">Gasolina</option>
                <option value="Diésel">Diésel</option>
                <option value="Híbrido">Híbrido</option>
                <option value="Eléctrico">Eléctrico</option>
              </select>
            </AdminField>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <AdminField label="Carrocería">
              <select {...register('body_type')} className={selectClass} style={inputStyle}>
                <option value="">—</option>
                <option value="Sedán">Sedán</option>
                <option value="SUV">SUV</option>
                <option value="Pickup">Pickup</option>
                <option value="Camioneta">Camioneta</option>
                <option value="Hatchback">Hatchback</option>
                <option value="Coupé">Coupé</option>
                <option value="Convertible">Convertible</option>
              </select>
            </AdminField>
            <AdminField label="Color">
              <input {...register('color')} className={inputClass} style={inputStyle} placeholder="Blanco perla" />
            </AdminField>
            <AdminField label="Condición">
              <select {...register('condition')} className={selectClass} style={inputStyle}>
                <option value="">—</option>
                <option value="Excelente">Excelente</option>
                <option value="Muy bueno">Muy bueno</option>
                <option value="Bueno">Bueno</option>
                <option value="Regular">Regular</option>
              </select>
            </AdminField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <AdminField label="Puertas">
              <select {...register('doors')} className={selectClass} style={inputStyle}>
                <option value="">—</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </AdminField>
            <AdminField label="Cilindros">
              <select {...register('cylinders')} className={selectClass} style={inputStyle}>
                <option value="">—</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="8">8</option>
                <option value="10">10</option>
                <option value="12">12</option>
              </select>
            </AdminField>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <AdminField label="Tracción">
              <select {...register('drive_type')} className={selectClass} style={inputStyle}>
                <option value="">—</option>
                <option value="4x2">4×2</option>
                <option value="4x4">4×4</option>
                <option value="AWD">AWD</option>
                <option value="FWD">FWD</option>
                <option value="RWD">RWD</option>
              </select>
            </AdminField>
            <AdminField label="Procedencia">
              <select {...register('origin')} className={selectClass} style={inputStyle}>
                <option value="">—</option>
                <option value="nacional">Nacional</option>
                <option value="importado">Importado</option>
              </select>
            </AdminField>
            <AdminField label="Adeudo">
              <select {...register('has_debt')} className={selectClass} style={inputStyle}>
                <option value="">Sin información</option>
                <option value="false">Sin adeudo</option>
                <option value="true">Con adeudo</option>
              </select>
            </AdminField>
          </div>

          <AdminField label="Descripción">
            <textarea
              {...register('description')}
              rows={4}
              className={inputClass}
              style={{ ...inputStyle, resize: 'vertical' }}
              placeholder="Detalla el estado, historial, accesorios y cualquier información relevante del vehículo."
            />
          </AdminField>
        </div>

        {serverError && <p className="text-[13px] text-red-500">{serverError}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="h-10 px-6 bg-orange text-white rounded-pill text-[13px] font-[500] hover:bg-orange-deep transition-colors disabled:opacity-60 cursor-pointer"
          >
            {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear vehículo'}
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

      {/* Fotos — solo disponibles una vez que el vehículo existe */}
      {savedVehicleId && (
        <div className="bg-white rounded-[14px] p-6" style={{ border: '0.5px solid var(--gray-line)' }}>
          <div className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500] mb-4">Fotos</div>
          <PhotoUploader vehicleId={savedVehicleId} initialPhotos={photos} />
          {!isEdit && (
            <div className="mt-6 pt-4" style={{ borderTop: '0.5px solid var(--gray-line)' }}>
              <button
                type="button"
                onClick={() => router.push('/admin/inventario')}
                className="h-10 px-6 bg-dark text-white rounded-pill text-[13px] font-[500] hover:bg-dark/90 transition-colors cursor-pointer"
              >
                Listo, ver inventario
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
