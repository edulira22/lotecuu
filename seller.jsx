// LoteCUU — Seller profile screen (/vendedores/[slug])

function SellerHero({ seller, mode = 'desktop' }) {
  const isMobile = mode === 'mobile';
  return (
    <section style={{
      background: `linear-gradient(135deg, ${seller.logoColor} 0%, ${seller.logoColor}dd 60%, ${seller.logoAccent}66 100%)`,
      color: '#fff',
      padding: isMobile ? '28px 18px 24px' : '52px 40px 40px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative stripes — sparse, brand-colored */}
      <svg style={{ position: 'absolute', top: 0, right: 0, width: 380, height: '100%', opacity: 0.18, pointerEvents: 'none' }} viewBox="0 0 380 240">
        <g stroke="#fff" strokeWidth="1.4" fill="none">
          <path d="M40 0 L120 240" />
          <path d="M120 0 L200 240" />
          <path d="M210 0 L290 240" />
        </g>
      </svg>

      <div style={{ position: 'relative', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'flex-end', gap: isMobile ? 16 : 28 }}>
        {/* Big mark on a frosted plate */}
        <div style={{
          background: 'rgba(255,255,255,0.96)',
          borderRadius: 18,
          padding: isMobile ? 14 : 20,
          display: 'inline-flex',
          flexShrink: 0,
          boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
        }}>
          <SellerLogo sellerId={seller.id} size={isMobile ? 72 : 96} variant="mark" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minWidth: 0 }}>
          {seller.verified && (
            <span style={{
              alignSelf: 'flex-start',
              fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 600,
              padding: '4px 10px', borderRadius: 999,
              background: 'rgba(255,255,255,0.18)', color: '#fff',
              display: 'inline-flex', alignItems: 'center', gap: 5,
              backdropFilter: 'blur(8px)',
            }}>
              <Icon name="check" size={11} /> Vendedor verificado
            </span>
          )}
          <h1 style={{
            fontSize: isMobile ? 30 : 46,
            fontWeight: 600,
            margin: 0,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
          }}>{seller.name}</h1>
          {seller.tagline && (
            <div style={{ fontSize: isMobile ? 14 : 16, opacity: 0.88, maxWidth: 600 }}>
              {seller.tagline}
            </div>
          )}
        </div>

        {!isMobile && (
          <button className="lc-btn" style={{
            background: '#fff', color: seller.logoColor,
            fontSize: 14, padding: '12px 20px', fontWeight: 600,
            flexShrink: 0,
          }}>
            <Icon name="whatsapp" size={16} color={seller.logoColor} />
            Contactar lote
          </button>
        )}
      </div>
    </section>
  );
}

function StatsBar({ seller, mode }) {
  const stats = [
    { label: 'Inventario', value: seller.inventory, suffix: 'autos' },
    { label: 'Vendidos', value: seller.sold, suffix: 'históricos' },
    { label: 'Calificación', value: `★ ${seller.rating}`, suffix: `${seller.reviewCount} reseñas` },
    { label: 'Antigüedad', value: seller.yearsActive, suffix: 'años' },
  ];
  const isMobile = mode === 'mobile';
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
      borderBottom: '0.5px solid var(--gray-line)',
      borderTop: '0.5px solid var(--gray-line)',
      background: '#fff',
    }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          padding: isMobile ? '16px 18px' : '20px 28px',
          borderRight: (!isMobile && i < 3) || (isMobile && i % 2 === 0) ? '0.5px solid var(--gray-line)' : 'none',
          borderBottom: isMobile && i < 2 ? '0.5px solid var(--gray-line)' : 'none',
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: 4 }}>
            {s.label}
          </div>
          <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 600, letterSpacing: '-0.015em', lineHeight: 1 }}>
            {s.value}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {s.suffix}
          </div>
        </div>
      ))}
    </div>
  );
}

function ContactBlock({ seller }) {
  const rows = [
    { icon: 'pin', label: 'Ubicación', value: seller.location },
    { icon: 'whatsapp', label: 'WhatsApp', value: seller.whatsapp },
    { icon: 'calendar', label: 'Horario', value: seller.hours },
  ].filter(r => r.value);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {rows.map((r, i) => (
        <div key={i} style={{
          display: 'flex', gap: 12, padding: '14px 0',
          borderBottom: i < rows.length - 1 ? '0.5px solid var(--gray-line)' : 'none',
        }}>
          <span style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--bg-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: seller.logoColor, flexShrink: 0,
          }}>
            <Icon name={r.icon} size={14} />
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>{r.label}</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{r.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SellerInventoryCard({ car, onOpen }) {
  return (
    <div className="lc-card" onClick={() => onOpen && onOpen(car)} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', opacity: car.status === 'sold' ? 0.6 : 1 }}>
      <div className="lc-photo" style={{ height: 160 }}>
        <CarPlaceholder tone={car.tone} plate={car.plate} />
        <div style={{ position: 'absolute', top: 10, left: 10 }}>
          <Status kind={car.status} />
        </div>
      </div>
      <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.3 }}>{car.title}</div>
        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--orange)' }}>
          {car.price ? fmtPrice(car.price) : 'Consultar precio'}
        </div>
        {(car.year || car.km) && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {car.year}{car.year && car.km ? ' · ' : ''}{car.km && fmtKm(car.km)}
          </div>
        )}
      </div>
    </div>
  );
}

function SellerScreen({ mode = 'desktop', sellerId = 'autos-lira', onBack, onOpenCar }) {
  const seller = getSeller(sellerId) || getSeller('autos-lira');
  const cars = CARS.filter(c => c.seller.id === sellerId);
  const isMobile = mode === 'mobile';
  const [tab, setTab] = React.useState('all');
  const filtered = tab === 'all' ? cars : cars.filter(c => c.status === tab);

  return (
    <div className="lc-screen" style={{ minHeight: '100%', background: 'var(--bg-primary)' }}>
      {/* Top thin nav */}
      <div style={{
        padding: isMobile ? '12px 18px' : '14px 40px',
        display: 'flex', alignItems: 'center', gap: 16,
        borderBottom: '0.5px solid var(--gray-line)',
        background: 'var(--bg-primary)',
        position: 'sticky', top: 0, zIndex: 30,
      }}>
        <button onClick={onBack} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
          margin: '-6px -10px', borderRadius: 8,
          fontSize: 13, color: 'var(--text-primary)', fontWeight: 500,
          fontFamily: 'var(--font)',
        }}>
          <Icon name="arrow-left" size={14} />
          {isMobile ? '' : 'Volver al feed'}
        </button>
        <div style={{ flex: 1 }} />
        <Logo height={32} />
      </div>

      <SellerHero seller={seller} mode={mode} />
      <StatsBar seller={seller} mode={mode} />

      <div style={{
        padding: isMobile ? '24px 18px 60px' : '36px 40px 80px',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 320px',
        gap: isMobile ? 28 : 40,
      }}>
        {/* Inventory column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>
              Autos en venta
            </h2>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{filtered.length} en este filtro</span>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'Todos' },
              { id: 'available', label: 'Disponibles' },
              { id: 'reserved', label: 'Apartados' },
              { id: 'sold', label: 'Vendidos' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`lc-filter ${tab === t.id ? 'lc-filter--active' : ''}`}
              >{t.label}</button>
            ))}
          </div>

          {filtered.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)',
              gap: isMobile ? 12 : 16,
            }}>
              {filtered.map(c => <SellerInventoryCard key={c.id} car={c} onOpen={onOpenCar} />)}
            </div>
          ) : (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 12 }}>
              Este vendedor no tiene autos en este filtro.
            </div>
          )}
        </div>

        {/* Sidebar — only desktop. On mobile this collapses to top. */}
        {!isMobile && (
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <div className="lc-eyebrow" style={{ color: 'var(--text-muted)', marginBottom: 8 }}>Sobre el lote</div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-primary)', margin: 0 }}>
                {seller.description}
              </p>
            </div>
            <div>
              <div className="lc-eyebrow" style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Contacto</div>
              <ContactBlock seller={seller} />
            </div>
            <button className="lc-btn" style={{
              background: 'var(--orange)', color: '#fff',
              fontSize: 14, padding: '14px 20px', borderRadius: 12,
            }}>
              <Icon name="whatsapp" size={16} />
              Enviar mensaje
            </button>
          </aside>
        )}

        {/* Mobile bottom info */}
        {isMobile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 8, borderTop: '0.5px solid var(--gray-line)' }}>
            <div>
              <div className="lc-eyebrow" style={{ color: 'var(--text-muted)', marginBottom: 8 }}>Sobre el lote</div>
              <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>{seller.description}</p>
            </div>
            <ContactBlock seller={seller} />
            <button className="lc-btn" style={{
              background: 'var(--orange)', color: '#fff',
              fontSize: 14, padding: '14px', borderRadius: 12,
            }}>
              <Icon name="whatsapp" size={16} />
              Enviar mensaje al lote
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

window.SellerScreen = SellerScreen;
