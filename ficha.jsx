// LoteCUU — Ficha individual screen (desktop + mobile via mode prop)
// Gallery is provided by FilmstripGallery (gallery.jsx).
const Gallery = (props) => <FilmstripGallery {...props} />;

function SpecGrid({ car }) {
  const specs = [
    { icon: 'calendar', label: 'Año', value: car.year },
    { icon: 'gauge', label: 'Kilometraje', value: car.km && fmtKm(car.km) },
    { icon: 'gear', label: 'Transmisión', value: car.transmission },
    { icon: 'fuel', label: 'Combustible', value: car.fuel },
    { icon: 'car', label: 'Tipo', value: car.type },
    { icon: 'paint', label: 'Color', value: car.color },
    { icon: 'check', label: 'Condición', value: car.condition },
  ].filter(s => s.value);

  if (specs.length === 0) return null;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '0 24px',
    }}>
      {specs.map((s, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 0',
          borderBottom: '0.5px solid var(--gray-line)',
        }}>
          <span style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--bg-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--teal)',
            flexShrink: 0,
          }}>
            <Icon name={s.icon} size={15} />
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{s.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SellerCard({ seller, onOpenSeller }) {
  const full = getSeller(seller.id) || seller;
  return (
    <div style={{
      background: '#fff',
      border: '0.5px solid var(--gray-line)',
      borderRadius: 12,
      padding: '18px',
      display: 'flex', flexDirection: 'column', gap: 14,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Brand color top stripe */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 4,
        background: `linear-gradient(90deg, ${full.logoColor || '#1A4D6B'}, ${full.logoAccent || '#E56A2E'})`,
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
        <SellerLogo sellerId={seller.id} size={48} variant="mark" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
            Vendedor verificado
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: full.logoColor || 'inherit' }}>{seller.name}</div>
          {full.location && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="pin" size={11} />
              {full.location}
            </div>
          )}
        </div>
      </div>

      {full.rating && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--orange)' }}>★ {full.rating}</span>
          <span>· {full.reviewCount} reseñas</span>
          <span>· {full.yearsActive} años en LoteCUU</span>
        </div>
      )}

      <button className="lc-btn lc-btn--ghost" style={{ fontSize: 13, padding: '10px 14px', width: '100%' }}>
        <Icon name="whatsapp" size={14} color="var(--whatsapp-deep)" />
        WhatsApp del vendedor
      </button>

      <a
        onClick={() => onOpenSeller && onOpenSeller(seller.id)}
        style={{
        fontSize: 13, color: 'var(--teal)', textDecoration: 'none',
        display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500,
        cursor: 'pointer',
      }}>
        Ver todos sus autos
        <Icon name="arrow-right" size={13} />
      </a>
    </div>
  );
}

function FichaScreen({ mode = 'desktop', carId = 'toyota-hilux-2022', onBack, onOpenSeller }) {
  const car = CARS.find(c => c.id === carId) || CARS[0];
  const isMobile = mode === 'mobile';
  const moreFromSeller = CARS.filter(c => c.seller.id === car.seller.id && c.id !== car.id).slice(0, 3);

  // Whatsapp message
  const waMsg = `Hola, vi el ${car.title} en LoteCUU. ¿Sigue disponible?`;

  // Top breadcrumb / back nav
  const TopBar = (
    <div style={{
      padding: isMobile ? '12px 18px' : '18px 40px',
      display: 'flex', alignItems: 'center', gap: 16,
      borderBottom: '0.5px solid var(--gray-line)',
      background: 'var(--bg-primary)',
      position: 'sticky', top: 0, zIndex: 30,
    }}>
      <button
        onClick={onBack}
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
          margin: '-6px -10px',
          borderRadius: 8,
          fontSize: 13, color: 'var(--text-primary)', fontWeight: 500,
          fontFamily: 'var(--font)',
        }}>
        <Icon name="arrow-left" size={14} />
        {isMobile ? '' : 'Volver al feed'}
      </button>
      {!isMobile && (
        <>
          <div style={{ flex: 1 }} />
          <Logo height={36} />
          <div style={{ flex: 1 }} />
          <button className="lc-btn lc-btn--ghost" style={{ fontSize: 12, padding: '7px 12px' }}>
            <Icon name="share" size={13} />
            Compartir
          </button>
        </>
      )}
      {isMobile && (
        <>
          <div style={{ flex: 1 }} />
          <button style={{ background: 'transparent', border: 'none', padding: 6, cursor: 'pointer' }}>
            <Icon name="share" size={18} />
          </button>
        </>
      )}
    </div>
  );

  // Right column / info
  const InfoCol = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, padding: isMobile ? '20px 18px 120px' : '0' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Status kind={car.status} />
          {car.featured && <FeaturedPill />}
        </div>

        <div>
          <h1 style={{ fontSize: isMobile ? 24 : 30, fontWeight: 500, lineHeight: 1.1, margin: 0, letterSpacing: '-0.015em' }}>
            {car.title}
          </h1>
          {car.trim && (
            <div style={{ fontSize: 16, color: 'var(--text-muted)', marginTop: 4 }}>
              {car.trim}
            </div>
          )}
        </div>

        {car.price ? (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{
              fontSize: isMobile ? 28 : 34,
              fontWeight: 500,
              color: 'var(--orange)',
              letterSpacing: '-0.02em',
            }}>
              {fmtPrice(car.price)}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>MXN</span>
          </div>
        ) : (
          <div style={{ fontSize: 18, color: 'var(--text-muted)', fontWeight: 500 }}>
            Consultar precio
          </div>
        )}
      </div>

      {/* CTAs - hidden on mobile because sticky bottom bar handles it */}
      {!isMobile && car.status !== 'sold' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            className="lc-btn"
            style={{
              background: 'var(--orange)', color: '#fff',
              fontSize: 15, padding: '14px 20px',
              borderRadius: 12,
              width: '100%',
            }}
          >
            <Icon name="whatsapp" size={18} />
            Contactar por WhatsApp
          </button>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
            "{waMsg}"
          </div>
        </div>
      )}

      {/* Specs */}
      <div>
        <div className="lc-eyebrow" style={{ color: 'var(--text-muted)', marginBottom: 6 }}>Características</div>
        <SpecGrid car={car} />
      </div>

      {car.description && (
        <div>
          <div className="lc-eyebrow" style={{ color: 'var(--text-muted)', marginBottom: 10 }}>Descripción</div>
          <div className="lc-quote">
            "{car.description}"
          </div>
        </div>
      )}

      <SellerCard seller={car.seller} onOpenSeller={onOpenSeller} />
    </div>
  );

  return (
    <div className="lc-screen" style={{ minHeight: '100%', background: 'var(--bg-primary)', position: 'relative' }}>
      {TopBar}

      {isMobile ? (
        <div>
          <div style={{ marginTop: 0 }}>
            <Gallery car={car} mode={mode} />
          </div>
          {InfoCol}

          {/* More from seller */}
          {moreFromSeller.length > 0 && (
            <div style={{ padding: '0 18px 120px' }}>
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 12 }}>
                Más autos de {car.seller.name}
              </div>
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto' }} className="lc-noscroll">
                {moreFromSeller.map(c => (
                  <div key={c.id} style={{ minWidth: 220, flexShrink: 0 }}>
                    <MiniCard car={c} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sticky mobile WhatsApp bar */}
          {car.status !== 'sold' && (
            <div
              className="lc-mobile-cta-shadow"
              style={{
                position: 'sticky', bottom: 0,
                background: 'var(--bg-primary)',
                borderTop: '0.5px solid var(--gray-line)',
                padding: '12px 18px',
                display: 'flex', alignItems: 'center', gap: 10,
                zIndex: 40,
              }}>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Precio</div>
                <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--orange)' }}>
                  {car.price ? fmtPrice(car.price) : 'Consultar'}
                </div>
              </div>
              <button
                className="lc-btn"
                style={{
                  background: 'var(--orange)', color: '#fff',
                  fontSize: 14, padding: '12px 18px',
                  borderRadius: 12, flexShrink: 0,
                }}>
                <Icon name="whatsapp" size={16} />
                WhatsApp
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: '32px 40px 64px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 40, alignItems: 'start' }}>
          <Gallery car={car} mode={mode} />
          {InfoCol}

          {moreFromSeller.length > 0 && (
            <div style={{ gridColumn: '1 / -1', marginTop: 32 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 500, margin: 0 }}>
                  Más autos de {car.seller.name}
                </h3>
                <a onClick={() => onOpenSeller && onOpenSeller(car.seller.id)} style={{ fontSize: 13, color: 'var(--teal)', fontWeight: 500, textDecoration: 'none', cursor: 'pointer' }}>
                  Ver perfil completo →
                </a>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {moreFromSeller.map(c => <MiniCard key={c.id} car={c} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MiniCard({ car }) {
  return (
    <div className="lc-card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="lc-photo" style={{ height: 130 }}>
        <CarPlaceholder tone={car.tone} plate={car.plate} />
        <div style={{ position: 'absolute', top: 8, left: 8 }}>
          <Status kind={car.status} />
        </div>
      </div>
      <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3 }}>{car.title}</div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--orange)' }}>
          {car.price ? fmtPrice(car.price) : 'Consultar'}
        </div>
      </div>
    </div>
  );
}

window.FichaScreen = FichaScreen;
