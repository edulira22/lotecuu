'use client'

import { useEffect, useRef, useState } from 'react'
import { FileText, Download, Trash2, Upload, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/browser'
import type { VehicleDocument } from '@/lib/supabase/database.types'

const BUCKET = 'vehicle-docs'
const MAX_BYTES = 15 * 1024 * 1024
const SUGGESTIONS = ['Seguro', 'Contrato de compraventa', 'Factura', 'Tarjeta de circulación', 'Verificación', 'Tenencias pagadas']

const inputClass = 'w-full px-3 py-2.5 rounded-[4px] text-[14px] outline-none bg-white'
const inputStyle = { border: '0.5px solid var(--gray-line-strong)' }

function fmtSize(bytes: number | null) {
  if (!bytes) return ''
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`
}

/**
 * Private per-car paperwork (insurance, sale contract, invoice…). Files go to
 * a private bucket and are opened through short-lived signed links.
 */
export function VehicleDocuments({ vehicleId }: { vehicleId: string }) {
  const [state, setState] = useState<'loading' | 'ready' | 'unavailable'>('loading')
  const [docs, setDocs] = useState<VehicleDocument[]>([])
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    createClient()
      .from('vehicle_documents')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false })
      .then(({ data, error: e }) => {
        if (e) { setState('unavailable'); return }
        setDocs((data ?? []) as VehicleDocument[])
        setState('ready')
      })
  }, [vehicleId])

  async function upload(file: File | undefined) {
    if (!file) return
    if (file.size > MAX_BYTES) { setError('El archivo pesa más de 15 MB.'); return }
    setBusy(true); setError('')
    const supabase = createClient()
    const safe = file.name.normalize('NFD').replace(/[^\w.-]+/g, '_').slice(-80)
    const path = `vehicles/${vehicleId}/${Date.now()}-${safe}`
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false })
    if (upErr) { setError(upErr.message); setBusy(false); return }
    const { data, error: dbErr } = await supabase
      .from('vehicle_documents')
      .insert({
        vehicle_id: vehicleId,
        name: name.trim() || file.name,
        storage_path: path,
        size_bytes: file.size,
        mime_type: file.type || null,
      })
      .select()
      .single()
    if (dbErr) {
      await supabase.storage.from(BUCKET).remove([path])
      setError(dbErr.message); setBusy(false); return
    }
    setDocs((prev) => [data as VehicleDocument, ...prev])
    setName('')
    setBusy(false)
  }

  async function open(doc: VehicleDocument) {
    setError('')
    const { data, error: e } = await createClient().storage.from(BUCKET).createSignedUrl(doc.storage_path, 60)
    if (e || !data) { setError(e?.message ?? 'No se pudo abrir el archivo.'); return }
    window.open(data.signedUrl, '_blank', 'noopener')
  }

  async function remove(doc: VehicleDocument) {
    if (!window.confirm(`¿Eliminar "${doc.name}"? Esta acción no se puede deshacer.`)) return
    const supabase = createClient()
    await supabase.storage.from(BUCKET).remove([doc.storage_path])
    const { error: e } = await supabase.from('vehicle_documents').delete().eq('id', doc.id)
    if (e) { setError(e.message); return }
    setDocs((prev) => prev.filter((d) => d.id !== doc.id))
  }

  return (
    <section className="bg-white rounded-[6px] p-6 flex flex-col gap-5" style={{ border: '0.5px solid var(--gray-line)' }}>
      <div>
        <h2 className="text-[16px] font-[600] m-0">Documentos</h2>
        <p className="text-[12px] text-text-muted m-0 mt-1 inline-flex items-center gap-1.5">
          <Lock size={12} /> Privado. Guarda aquí el seguro, el contrato o lo que necesites tener a la mano.
        </p>
      </div>

      {state === 'loading' && <p className="text-[13px] text-text-muted m-0">Cargando…</p>}
      {state === 'unavailable' && (
        <p className="text-[13px] text-text-muted m-0">
          Esta herramienta se activa cuando la administración corra la migración 006 en Supabase.
        </p>
      )}

      {state === 'ready' && (
        <>
          <div className="flex flex-col gap-2.5">
            <div className="flex gap-2 flex-wrap">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setName(s)}
                  className="px-2.5 py-1 rounded-[4px] text-[12px] font-[500] transition-colors"
                  style={name === s ? { background: '#012538', color: '#fff' } : { background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)' }}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-2 flex-col sm:flex-row">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del documento (opcional)"
                className={inputClass}
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className="shrink-0 inline-flex items-center justify-center gap-2 h-[42px] px-5 rounded-[4px] text-[13px] font-[500] bg-dark text-white hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                <Upload size={14} />
                {busy ? 'Subiendo…' : 'Subir archivo'}
              </button>
            </div>
            <span className="text-[11px] text-text-muted">PDF, fotos o documentos · máx. 15 MB</span>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,image/*,.doc,.docx,.xls,.xlsx"
              className="hidden"
              onChange={(e) => { upload(e.target.files?.[0]); e.target.value = '' }}
            />
          </div>

          {error && <p className="text-[13px] text-red-500 m-0">{error}</p>}

          {docs.length === 0 ? (
            <p className="text-[13px] text-text-muted m-0">Aún no hay documentos.</p>
          ) : (
            <ul className="m-0 p-0 list-none rounded-[4px] overflow-hidden" style={{ border: '0.5px solid var(--gray-line)' }}>
              {docs.map((d, i) => (
                <li
                  key={d.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderTop: i ? '0.5px solid var(--gray-line)' : 'none' }}
                >
                  <FileText size={16} className="text-teal shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-[500] truncate">{d.name}</div>
                    <div className="text-[11px] text-text-muted">
                      {new Date(d.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {d.size_bytes ? ` · ${fmtSize(d.size_bytes)}` : ''}
                    </div>
                  </div>
                  <button type="button" onClick={() => open(d)} title="Abrir" aria-label={`Abrir ${d.name}`} className="w-8 h-8 rounded-[4px] flex items-center justify-center hover:bg-surface-alt transition-colors">
                    <Download size={15} />
                  </button>
                  <button type="button" onClick={() => remove(d)} title="Eliminar" aria-label={`Eliminar ${d.name}`} className="w-8 h-8 rounded-[4px] flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
