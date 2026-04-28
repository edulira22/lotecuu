export default function FichaPage({ params }: { params: Promise<{ slug: string }> }) {
  void params
  return (
    <main className="flex-1 flex items-center justify-center">
      <p className="text-text-muted">Ficha del auto — próximamente</p>
    </main>
  )
}
