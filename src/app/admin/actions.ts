'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function createSellerAccount(
  sellerId: string,
  email: string,
  password: string,
) {
  const adminClient = createAdminClient()

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'seller' },
  })
  if (error) return { error: error.message }

  const { error: linkErr } = await adminClient
    .from('sellers')
    .update({ auth_user_id: data.user.id })
    .eq('id', sellerId)

  if (linkErr) {
    await adminClient.auth.admin.deleteUser(data.user.id)
    return { error: linkErr.message }
  }

  revalidatePath('/admin/vendedores')
  return { success: true }
}

export async function deleteSellerAccount(userId: string, sellerId: string) {
  const adminClient = createAdminClient()
  await adminClient.from('sellers').update({ auth_user_id: null }).eq('id', sellerId)
  const { error } = await adminClient.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }
  revalidatePath('/admin/vendedores')
  return { success: true }
}

export async function updateSellerPlan(
  sellerId: string,
  plan: 'basico' | 'pro' | 'premium',
  maxVehicles: number,
  paymentStatus: 'al_corriente' | 'atrasado' | 'suspendido',
  paymentNotes: string,
) {
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('sellers')
    .update({ plan, max_vehicles: maxVehicles, payment_status: paymentStatus, payment_notes: paymentNotes || null })
    .eq('id', sellerId)
  if (error) return { error: error.message }
  revalidatePath('/admin/vendedores')
  revalidatePath('/admin/dashboard')
  return { success: true }
}
