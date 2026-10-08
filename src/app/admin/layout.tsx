import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="flex flex-col md:flex-row min-h-screen" style={{ background: '#F4F2EC' }}>
      <AdminSidebar />
      {/* pb leaves room for the phone tab bar */}
      <main className="flex-1 min-w-0 pb-[calc(76px+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </main>
    </div>
  )
}
