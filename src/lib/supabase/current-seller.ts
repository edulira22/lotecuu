import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Seller } from '@/lib/supabase/database.types'

/** Statuses that count against the plan's vehicle limit */
export const ACTIVE_STATUSES = ['published', 'reserved', 'hidden', 'draft'] as const

/**
 * The signed-in seller for portal pages (cached per request, so the layout
 * and the page share one lookup). Sends anyone else to login or the admin.
 */
export const requireSeller = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase.from('sellers').select('*').eq('auth_user_id', user.id).maybeSingle()
  if (!data) redirect('/admin/dashboard')

  return { supabase, seller: data as unknown as Seller }
})
