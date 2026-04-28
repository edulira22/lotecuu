// LoteCUU — Admin panel (lightweight)
// One screen where the seller manages identity + their cars.
// Intentionally simple: not the focus of this design pass.

function AdminScreen({ mode = 'desktop', sellerId = 'autos-lira' }) {
  const seller = getSeller(sellerId);
  const myCars = CARS.filter(c => c.seller.id === sellerId);
  const [tab, setTab] = React.useState('inventory');
  const isMobile = mode === 'mobile';

  return (
    <div className="lc-screen" style={{ minHeight: '100%', background: '#F4F2EC', display: 'flex', flexDirection: isMobile ? 'column' : 'row' }}>
      {/* Sidebar */}
      <aside style={{
        width: isMobile ? '100%' : 240,
        background: '#1E232B',
        color: '#fff',
        padding: isMobile ? '14px 18px' : '24px 18px',
        display: 'flex',
        flexDirection: isMobile ? 'row' : 'column',
        alignItems: isMobile ? 'center' : 'stretch',
        gap: isMobile ? 12 : 6,
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: isMobile ? 0 : '4px 10px 16px',
          borderBottom: isMobile ? 'none' : '0.5px solid rgba(255,255,255,0.12)',
          marginBottom: isMobile ? 0 : 10,
          flex: isMobile ? 1 : 'unset',
          minWidth: 0,
        }}>
          <span style={{ background: '#fff', borderRadius: 8, padding: 4, display: 'inline-flex' }}>
            <SellerLogo sellerId={sellerId} size={28} variant="mark" />
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{seller.name}</div>
            <div style={{ fontSize: 10, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Panel admin</div>
          </div>
        </div>

        {[
          { id: 'inventory', label: 'Inventario', icon: 'car' },
          { id: 'profile', label: 'Mi perfil', icon: 'sliders' },
          { id: 'messages', label: 'Mensajes', icon: 'whatsapp' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: isMobile ? '8px 12px' : '10px 12px',
            borderRadius: 8,
            border: 'none',
            background: tab === t.id ? 'rgba(229,106,46,0.18)' : 'transparent',
            color: tab === t.id ? '#FCAE7A' : 'rgba(255,255,255,0.75)',
            cursor: 'pointer',
            fontFamily: 'var(--font)',
            fontSize: 13,
            fontWeight: 500,
            textAlign: 'left',
            whiteSpace: 'nowrap',
          }}>
            <Icon name={t.icon} size={14} />
            {t.label}
          </button>
        ))}
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: isMobile ? '20px 18px 40px' : '32px 40px 60px', overflow: 'auto' }}>
        {tab === 'inventory' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 600, margin: 0, letterSpacing: '-0.015em' }}>Mi inventario</h1>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                  {myCars.length} autos publicados
                </div>
              </div>
              <button className="lc-btn lc-btn--orange" style={{ fontSize: 13, padding: '10px 16px' }}>
                <Icon name="plus" size={14} />
                Publicar auto
              </button>
            </div>

            <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid var(--gray-line)', overflow: 'hidden' }}>
              {/* table header */}
              {!isMobile && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '64px 1.6fr 1fr 110px 120px 90px',
                  gap: 14, padding: '12px 18px',
                  background: 'var(--bg-secondary)',
                  fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500,
                }}>
                  <span></span>
                  <span>Auto</span>
                  <span>Estado</span>
                  <span>Año</span>
                  <span style={{ textAlign: 'right' }}>Precio</span>
                  <span></span>
                </div>
              )}

              {myCars.map((c, i) => (
                <div key={c.id} style={{
                  display: isMobile ? 'flex' : 'grid',
                  gridTemplateColumns: '64px 1.6fr 1fr 110px 120px 90px',
                  gap: 14,
                  alignItems: 'center',
                  padding: '14px 18px',
                  borderTop: i === 0 ? 'none' : '0.5px solid var(--gray-line)',
                }}>
                  <div style={{ width: 64, height: 44, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: 'var(--bg-secondary)' }}>
                    <CarPlaceholder tone={c.tone} plate={c.plate} />
                  </div>
                  <div style={{ minWidth: 0, flex: isMobile ? 1 : 'unset' }}>
                    <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.3 }}>{c.title}</div>
                    {c.trim && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.trim}</div>}
                    {isMobile && (
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--orange)', marginTop: 4 }}>
                        {c.price ? fmtPrice(c.price) : 'Sin precio'}
                      </div>
                    )}
                  </div>
                  {!isMobile && (
                    <>
                      <div><Status kind={c.status} /></div>
                      <div style={{ fontSize: 13 }}>{c.year || '—'}</div>
                      <div style={{ fontSize: 14, fontWeight: 500, textAlign: 'right' }}>
                        {c.price ? fmtPrice(c.price) : <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>—</span>}
                      </div>
                      <button className="lc-btn lc-btn--ghost" style={{ fontSize: 12, padding: '6px 12px' }}>Editar</button>
                    </>
                  )}
                  {isMobile && (
                    <button className="lc-btn lc-btn--ghost" style={{ fontSize: 12, padding: '6px 12px', flexShrink: 0 }}>Editar</button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'profile' && (
          <>
            <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 600, margin: '0 0 20px', letterSpacing: '-0.015em' }}>Mi perfil</h1>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>
              {/* Brand identity */}
              <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '0.5px solid var(--gray-line)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="lc-eyebrow" style={{ color: 'var(--text-muted)' }}>Identidad</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: 10, borderRadius: 12 }}>
                    <SellerLogo sellerId={sellerId} size={56} variant="mark" />
                  </div>
                  <button className="lc-btn lc-btn--ghost" style={{ fontSize: 12, padding: '8px 14px' }}>
                    Cambiar logo
                  </button>
                </div>

                <AdminField label="Nombre del lote" value={seller.name} />
                <AdminField label="Tagline" value={seller.tagline} />
                <AdminField label="Descripción" value={seller.description} multiline />
              </div>

              {/* Contact */}
              <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '0.5px solid var(--gray-line)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="lc-eyebrow" style={{ color: 'var(--text-muted)' }}>Contacto</div>
                <AdminField label="Dirección" value={seller.location} />
                <AdminField label="WhatsApp" value={seller.whatsapp} />
                <AdminField label="Teléfono" value={seller.phone} />
                <AdminField label="Horario" value={seller.hours} />
                <button className="lc-btn lc-btn--orange" style={{ fontSize: 13, padding: '10px 16px', alignSelf: 'flex-start', marginTop: 4 }}>
                  Guardar cambios
                </button>
              </div>
            </div>
          </>
        )}

        {tab === 'messages' && (
          <>
            <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 600, margin: '0 0 8px', letterSpacing: '-0.015em' }}>Mensajes</h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 20px' }}>
              Los mensajes llegan directo a tu WhatsApp. Aquí solo verás un historial de quién ha consultado.
            </p>
            <div style={{ background: '#fff', borderRadius: 14, padding: 32, border: '0.5px solid var(--gray-line)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              Próximamente: log de consultas y métricas de conversión.
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function AdminField({ label, value, multiline }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500 }}>
        {label}
      </span>
      {multiline ? (
        <textarea
          defaultValue={value}
          rows={3}
          style={{
            fontFamily: 'var(--font)', fontSize: 14, padding: '10px 12px',
            border: '0.5px solid var(--gray-line-strong)', borderRadius: 8,
            background: '#fff', color: 'var(--text-primary)',
            resize: 'vertical', outline: 'none',
          }}
        />
      ) : (
        <input
          defaultValue={value}
          style={{
            fontFamily: 'var(--font)', fontSize: 14, padding: '10px 12px',
            border: '0.5px solid var(--gray-line-strong)', borderRadius: 8,
            background: '#fff', color: 'var(--text-primary)',
            outline: 'none',
          }}
        />
      )}
    </label>
  );
}

window.AdminScreen = AdminScreen;
