import type { SupabaseClient } from '@supabase/supabase-js'
import { sortPhotos } from '@/lib/photo-angles'
import type { PostVehicle } from '@/lib/social-post'
import type { StudioSeller } from '@/components/admin/social-post-studio'

type Photo = { url: string; is_cover: boolean; sort_order: number; angle: string | null }

/** Everything the social post studio needs for one car (null if not visible to this user) */
export async function loadStudioData(supabase: SupabaseClient, id: string, sellerId?: string) {
  let q = supabase
    .from('vehicles')
    .select(`
      id, title, slug, brand, model, version, year, mileage, transmission, fuel, body_type,
      price, negotiable, financing, status,
      seller:sellers(name, business_name, logo_url, profile_photo_url, whatsapp, phone),
      photos:vehicle_photos(url, is_cover, sort_order, angle)
    `)
    .eq('id', id)
  if (sellerId) q = q.eq('seller_id', sellerId)
  const { data: v } = await q.maybeSingle()
  if (!v) return null

  const s = v.seller as unknown as (StudioSeller & { business_name: string | null }) | null
  const vehicle: PostVehicle = {
    title: v.title, version: v.version, year: v.year, mileage: v.mileage, transmission: v.transmission,
    fuel: v.fuel, body_type: v.body_type, price: v.price, negotiable: v.negotiable,
    financing: v.financing, status: v.status,
  }
  return {
    id: v.id as string,
    vehicle,
    brand: v.brand as string | null,
    model: v.model as string | null,
    slug: v.slug as string,
    photos: sortPhotos((v.photos ?? []) as Photo[]).map((p) => p.url),
    seller: s ? { ...s, name: s.business_name ?? s.name } : null,
  }
}

export interface PickerVehicle {
  id: string
  title: string
  year: number | null
  status: string
  price: number | null
  cover: string | null
  photoCount: number
}

const STATUS_ORDER: Record<string, number> = { published: 0, reserved: 1, draft: 2, hidden: 3, sold: 4 }

/** Cars to choose from for a post, cars for sale first */
export async function loadPickerVehicles(supabase: SupabaseClient, sellerId?: string): Promise<PickerVehicle[]> {
  let q = supabase
    .from('vehicles')
    .select('id, title, year, status, price, created_at, photos:vehicle_photos(url, is_cover, sort_order, angle)')
    .order('created_at', { ascending: false })
  if (sellerId) q = q.eq('seller_id', sellerId)
  const { data } = await q
  return ((data ?? []) as unknown as (PickerVehicle & { photos: Photo[] })[])
    .map((v) => {
      const photos = sortPhotos(v.photos ?? [])
      return {
        id: v.id, title: v.title, year: v.year, status: v.status, price: v.price,
        cover: photos[0]?.url ?? null, photoCount: photos.length,
      }
    })
    .sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9))
}
