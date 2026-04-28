export default function VendedorPage({ params }: { params: Promise<{ slug: string }> }) {
  void params
  return (
    <main className="flex-1 flex items-center justify-center">
      <p className="text-text-muted">Perfil de vendedor — próximamente</p>
    </main>
  )
}
