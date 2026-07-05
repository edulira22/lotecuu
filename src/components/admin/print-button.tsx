'use client'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="h-9 px-5 bg-orange text-white rounded-pill text-[13px] font-[500] hover:bg-orange-deep transition-colors cursor-pointer"
    >
      Imprimir / Guardar PDF
    </button>
  )
}
