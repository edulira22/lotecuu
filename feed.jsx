// LoteCUU — Feed screen (desktop + mobile via `mode` prop)
const { useState, useMemo } = React;

const FEED_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'sedan', label: 'Sedán' },
  { id: 'suv', label: 'SUV' },
  { id: 'pickup', label: 'Pickup' },
  { id: 'camioneta', label: 'Camioneta' },
  { id: 'auto', label: 'Automático' },
  { id: 'manual', label: 'Manual' },
  { id: 'featured', label: '★ Destacados', featured: true },
  { id: 'budget', label: 'Hasta $200k' },
  { id: '2020plus', label: '2020 o más nuevo' },
];

// ─── Card ──────────────────────────────────────────────────────
function CarCard({ car, wide = false, onOpen, mode = 'desktop' }) {
  const dimmed = car.status === 'sold';
  const photoH = wide ? 230 : (mode === 'mobile' ? 200 : 168);

  // Build chip list - only chips with data
  const chips = [];
  if (car.year) chips.push(String(car.year));
  if (car.km) chips.push(fmtKm(car.km));
  if (car.transmission) chips.push(car.transmission);
  if (car.type) chips.push(car.type);
  if (car.fuel) chips.push(car.fuel);

  return (
    <div
      className="lc-card"
      onClick={() => onOpen && onOpen(car)}
      style={{
        cursor: 'pointer',
        opacity: dimmed ? 0.6 : 1,
        gridColumn: wide && mode === 'desktop' ? 'span 2' : 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="lc-photo" style={{ height: photoH }}>
        <CarPlaceholder tone={car.tone} plate={car.plate} />
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
          <Status kind={car.status} />
        </div>
        {car.featured && (
          <div style={{ position: 'absolute', top: 10, right: 10 }}>
            <FeaturedPill />
          </div>
        )}
      </div>

      <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: wide ? 16 : 14, fontWeight: 500, lineHeight: 1.3 }}>
            {car.title}
            {car.trim && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> · {car.trim}</span>}
          </div>
          {car.price ? (
            <div style={{ fontSize: wide ? 22 : 18, fontWeight: 500, color: 'var(--orange)', letterSpacing: '-0.01em' }}>
              {fmtPrice(car.price)}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}>
              Consultar precio
            </div>
          )}
        </div>

        {chips.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {chips.map((c, i) => <span key={i} className="lc-chip">{c}</span>)}
          </div>
        )}

        <div style={{ flex: 1 }} />
        <div className="lc-divider" />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <SellerLogo sellerId={car.seller.id} size={28} variant="mark" />
            <span style={{ fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
              {car.seller.name}
            </span>
          </div>
          {car.status === 'sold' ? (
            <button className="lc-btn lc-btn--ghost" style={{ fontSize: 11, padding: '6px 12px' }} onClick={(e) => e.stopPropagation()}>
              Ver ficha
            </button>
          ) : (
            <button className="lc-btn lc-btn--whatsapp" style={{ fontSize: 11, padding: '6px 12px' }} onClick={(e) => e.stopPropagation()}>
              <Icon name="whatsapp" size={12} />
              WhatsApp
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Navbar ────────────────────────────────────────────────────
function Navbar({ mode = 'desktop' }) {
  if (mode === 'mobile') {
    return (
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px',
        background: 'var(--bg-primary)',
        borderBottom: '0.5px solid var(--gray-line)',
      }}>
        <Logo height={36} />
        <button style={{ background: 'transparent', border: 'none', padding: 6, cursor: 'pointer' }}>
          <Icon name="menu" size={22} />
        </button>
      </header>
    );
  }
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 40px',
      background: 'var(--bg-primary)',
      borderBottom: '0.5px solid var(--gray-line)',
    }}>
      <Logo height={48} />
      <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        <a style={{ fontSize: 14, color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>Autos</a>
        <a style={{ fontSize: 14, color: 'var(--text-muted)', textDecoration: 'none' }}>Vendedores</a>
        <a style={{ fontSize: 14, color: 'var(--text-muted)', textDecoration: 'none' }}>Cómo funciona</a>
      </nav>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button className="lc-btn lc-btn--ghost" style={{ fontSize: 13, padding: '8px 14px' }}>Iniciar sesión</button>
        <button className="lc-btn lc-btn--orange" style={{ fontSize: 13, padding: '8px 16px' }}>
          <Icon name="plus" size={14} />
          Publicar auto
        </button>
      </div>
    </header>
  );
}

// ─── Hero strip ────────────────────────────────────────────────
function Hero({ mode = 'desktop' }) {
  const isMobile = mode === 'mobile';
  return (
    <section style={{
      background: 'var(--bg-dark)',
      color: '#fff',
      padding: isMobile ? '32px 18px 28px' : '56px 40px 48px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle road-line decoration in upper right */}
      {!isMobile && (
        <svg style={{ position: 'absolute', top: 0, right: 0, width: 360, height: '100%', opacity: 0.6, pointerEvents: 'none' }} viewBox="0 0 360 280">
          <g stroke="#E56A2E" strokeWidth="1" fill="none" opacity="0.35">
            <path d="M40 0 L100 280" />
            <path d="M120 0 L180 280" />
            <path d="M200 0 L260 280" />
          </g>
          <g stroke="#255C7A" strokeWidth="1" fill="none" opacity="0.25">
            <path d="M280 0 L340 280" />
          </g>
        </svg>
      )}

      <div style={{ maxWidth: 920, position: 'relative' }}>
        <div className="lc-eyebrow" style={{ color: 'var(--orange)', marginBottom: isMobile ? 14 : 18 }}>
          Chihuahua · Autos usados
        </div>
        <h1 style={{
          fontSize: isMobile ? 32 : 52,
          fontWeight: 500,
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
          margin: 0,
          marginBottom: isMobile ? 20 : 28,
        }}>
          Encuentra tu próximo auto en{' '}
          <span style={{ color: 'var(--orange)' }}>Chihuahua</span>
        </h1>

        <div style={{
          display: 'flex',
          gap: 8,
          padding: 6,
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 999,
          maxWidth: isMobile ? '100%' : 560,
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', flex: 1 }}>
            <Icon name="search" size={16} color="rgba(255,255,255,0.6)" />
            <input
              placeholder="Busca marca, modelo o año..."
              style={{
                flex: 1, border: 'none', background: 'transparent',
                color: '#fff', outline: 'none',
                fontSize: 14, fontFamily: 'var(--font)', fontWeight: 400,
                padding: '12px 0', minWidth: 0,
              }}
            />
          </div>
          <button className="lc-btn lc-btn--orange" style={{ padding: isMobile ? '10px 18px' : '10px 24px', fontSize: 14 }}>
            Buscar
          </button>
        </div>

        {!isMobile && (
          <div style={{ display: 'flex', gap: 28, marginTop: 32, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
            <div><span style={{ color: '#fff', fontWeight: 500 }}>284</span> autos publicados</div>
            <div><span style={{ color: '#fff', fontWeight: 500 }}>47</span> vendedores verificados</div>
            <div><span style={{ color: '#fff', fontWeight: 500 }}>WhatsApp directo</span> · sin formularios</div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Filter bar ────────────────────────────────────────────────
function FilterBar({ active, onChange, mode = 'desktop' }) {
  return (
    <div style={{
      borderBottom: '0.5px solid var(--gray-line)',
      background: 'var(--bg-primary)',
      position: 'sticky',
      top: mode === 'mobile' ? 64 : 76,
      zIndex: 20,
    }}>
      <div className="lc-noscroll" style={{
        display: 'flex',
        gap: 8,
        padding: mode === 'mobile' ? '12px 18px' : '14px 40px',
        overflowX: 'auto',
      }}>
        {FEED_FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => onChange(f.id)}
            className={`lc-filter ${active === f.id ? 'lc-filter--active' : ''} ${f.featured ? 'lc-filter--featured' : ''}`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Sort bar ──────────────────────────────────────────────────
function SortBar({ count, mode = 'desktop' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: mode === 'mobile' ? '14px 18px 8px' : '20px 40px 12px',
      fontSize: 13,
    }}>
      <span style={{ color: 'var(--text-muted)' }}>
        <strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{count}</strong> autos disponibles
      </span>
      <button style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 13, color: 'var(--text-primary)', fontWeight: 500,
        fontFamily: 'var(--font)',
      }}>
        Ordenar: Más recientes
        <Icon name="chevron" size={14} />
      </button>
    </div>
  );
}

// ─── Main feed component ───────────────────────────────────────
function FeedScreen({ mode = 'desktop', onOpenCar }) {
  const [filter, setFilter] = useState('all');

  // Sort: featured first, available before reserved, sold last
  const sortedCars = useMemo(() => {
    const order = { available: 0, reserved: 1, sold: 2 };
    return [...CARS].sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return (order[a.status] ?? 9) - (order[b.status] ?? 9);
    });
  }, []);

  const visibleCount = sortedCars.filter(c => c.status !== 'sold').length;

  const cols = mode === 'mobile' ? 1 : 3;
  const gap = mode === 'mobile' ? 14 : 16;

  return (
    <div className="lc-screen" style={{ minHeight: '100%', background: 'var(--bg-primary)' }}>
      <Navbar mode={mode} />
      <Hero mode={mode} />
      <FilterBar active={filter} onChange={setFilter} mode={mode} />
      <SortBar count={visibleCount} mode={mode} />

      <div style={{
        padding: mode === 'mobile' ? '0 18px 32px' : '0 40px 64px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap,
        }}>
          {sortedCars.map(car => (
            <CarCard
              key={car.id}
              car={car}
              wide={car.featured && mode === 'desktop'}
              mode={mode}
              onOpen={onOpenCar}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        background: 'var(--bg-dark)',
        color: 'rgba(255,255,255,0.7)',
        padding: mode === 'mobile' ? '32px 18px' : '48px 40px',
        marginTop: 32,
      }}>
        <div style={{ display: 'flex', flexDirection: mode === 'mobile' ? 'column' : 'row', justifyContent: 'space-between', gap: 24 }}>
          <div>
            <Logo variant="light" height={56} />
            <div style={{ fontSize: 13, marginTop: 12, maxWidth: 320, lineHeight: 1.5 }}>
              La vitrina digital de autos usados de Chihuahua. Hecho local, con cariño.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 48, fontSize: 13 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ color: '#fff', fontWeight: 500, marginBottom: 4 }}>Plataforma</div>
              <a style={{ color: 'inherit', textDecoration: 'none' }}>Autos</a>
              <a style={{ color: 'inherit', textDecoration: 'none' }}>Vendedores</a>
              <a style={{ color: 'inherit', textDecoration: 'none' }}>Publicar</a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ color: '#fff', fontWeight: 500, marginBottom: 4 }}>Contacto</div>
              <a style={{ color: 'inherit', textDecoration: 'none' }}>WhatsApp</a>
              <a style={{ color: 'inherit', textDecoration: 'none' }}>Instagram</a>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: '0.5px solid rgba(255,255,255,0.1)', fontSize: 12, opacity: 0.6 }}>
          © 2026 LoteCUU · Chihuahua, México
        </div>
      </footer>
    </div>
  );
}

window.FeedScreen = FeedScreen;
window.CarCard = CarCard;
