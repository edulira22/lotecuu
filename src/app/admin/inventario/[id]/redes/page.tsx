import { redirect } from 'next/navigation'

// Moved to its own section
export default async function OldRedesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/admin/redes/${id}`)
}
