import { PrintButton } from '@/components/admin/print-button'

export const metadata = { title: 'Formulario de captura — LoteCUU' }

export default function FormularioPage() {
  return (
    <>
      {/* Print button — hidden on print */}
      <div className="no-print flex items-center justify-between px-8 py-4 bg-white border-b" style={{ borderColor: 'var(--gray-line)' }}>
        <span className="text-[14px] font-[500]">Formulario de captura de vehículo</span>
        <PrintButton />
      </div>

      {/* Printable form */}
      <div className="print-page p-10 max-w-[800px] mx-auto">
        <style>{`
          @media print {
            .no-print { display: none !important; }
            .print-page { padding: 20px; max-width: 100%; }
            body { background: white; }
          }
          .field-line {
            border: none;
            border-bottom: 1px solid #ccc;
            width: 100%;
            height: 24px;
            display: block;
          }
          .section-title {
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #6b7280;
            border-bottom: 1.5px solid #012538;
            padding-bottom: 4px;
            margin-bottom: 12px;
          }
          label { font-size: 11px; color: #374151; font-weight: 500; }
        `}</style>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: '#012538' }}>LoteCUU</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Formulario de ingreso de vehículo</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 11, color: '#6b7280' }}>
            <div>Chihuahua, México</div>
            <div style={{ marginTop: 4 }}>
              Fecha: <span className="field-line" style={{ display: 'inline-block', width: 100, verticalAlign: 'bottom' }} />
            </div>
          </div>
        </div>

        {/* Vendedor */}
        <div style={{ marginBottom: 24 }}>
          <div className="section-title">Datos del vendedor</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
            <Field label="Nombre del lote / vendedor" />
            <Field label="Teléfono / WhatsApp" />
          </div>
        </div>

        {/* Identificación */}
        <div style={{ marginBottom: 24 }}>
          <div className="section-title">Identificación del vehículo</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px 24px' }}>
            <Field label="Marca" />
            <Field label="Modelo" />
            <Field label="Versión / Trim" />
            <Field label="Año" />
            <Field label="Color" />
            <Field label="No. de puertas" />
          </div>
        </div>

        {/* Especificaciones */}
        <div style={{ marginBottom: 24 }}>
          <div className="section-title">Especificaciones técnicas</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px 24px' }}>
            <Field label="Transmisión  □ Auto  □ Manual  □ CVT" />
            <Field label="Combustible  □ Gas  □ Diésel  □ Híbrido" />
            <Field label="Tracción  □ 4×2  □ 4×4  □ AWD" />
            <Field label="Cilindros" />
            <Field label="Kilometraje (km)" />
            <Field label="Condición  □ Excelente  □ Muy bueno  □ Bueno  □ Regular" />
          </div>
        </div>

        {/* Estado legal */}
        <div style={{ marginBottom: 24 }}>
          <div className="section-title">Estado legal y comercial</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px 24px' }}>
            <Field label="Procedencia  □ Nacional  □ Importado" />
            <Field label="Adeudo  □ Sin adeudo  □ Con adeudo" />
            <Field label="Dueños anteriores  □ Único  □ Más de uno" />
            <Field label="Precio de venta ($)" />
            <Field label="¿Precio negociable?  □ Sí  □ No" />
            <Field label="¿Acepta auto a cuenta?  □ Sí  □ No" />
          </div>
        </div>

        {/* Descripción */}
        <div style={{ marginBottom: 24 }}>
          <div className="section-title">Descripción / observaciones</div>
          {[0,1,2,3].map((i) => (
            <div key={i} className="field-line" style={{ marginBottom: 10 }} />
          ))}
        </div>

        {/* Fotos */}
        <div style={{ marginBottom: 24 }}>
          <div className="section-title">Fotos proporcionadas</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {['Frente', 'Lado derecho', 'Lado izquierdo', 'Trasera', 'Interior', 'Motor / detalles'].map((l) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                <div style={{ width: 14, height: 14, border: '1px solid #9ca3af', borderRadius: 3, flexShrink: 0 }} />
                {l}
              </div>
            ))}
          </div>
        </div>

        {/* Firmas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 36 }}>
          {['Firma del vendedor', 'Recibido por (LoteCUU)'].map((l) => (
            <div key={l}>
              <div className="field-line" style={{ marginBottom: 6 }} />
              <div style={{ fontSize: 11, color: '#6b7280' }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 32, paddingTop: 12, borderTop: '0.5px solid #e5e7eb', fontSize: 10, color: '#9ca3af', textAlign: 'center' }}>
          LoteCUU · Chihuahua, México · lotecuu.vercel.app
        </div>
      </div>
    </>
  )
}

function Field({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label>{label}</label>
      <div className="field-line" />
    </div>
  )
}
