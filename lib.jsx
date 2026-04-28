// LoteCUU — shared data + atomic components

// ─── Photo placeholders ──────────────────────────────────────────
// Stylized SVG "car on lot" silhouettes. These are PLACEHOLDERS that
// evoke the photo without faking real product imagery.
const CarPlaceholder = ({ tone = 'sunset', plate = 'CUU 2026' }) => {
  const palettes = {
    sunset:   { sky1: '#F4D6BC', sky2: '#E8B894', ground: '#C9A57F', body: '#1E232B', accent: '#E56A2E' },
    desert:   { sky1: '#EDE2CF', sky2: '#D6C2A4', ground: '#B69A75', body: '#3A3F47', accent: '#E56A2E' },
    twilight: { sky1: '#9FA9B8', sky2: '#5B6A7E', ground: '#3A4250', body: '#0E1218', accent: '#E56A2E' },
    cool:     { sky1: '#DCE6EE', sky2: '#A8B8C8', ground: '#7A8898', body: '#1E232B', accent: '#255C7A' },
    overcast: { sky1: '#E2E6EC', sky2: '#C0C8D2', ground: '#8C95A0', body: '#2B313A', accent: '#E56A2E' },
    night:    { sky1: '#23303D', sky2: '#0E1218', ground: '#0A0D12', body: '#FAFAF7', accent: '#E56A2E' },
  };
  const p = palettes[tone] || palettes.sunset;
  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <linearGradient id={`sky-${tone}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.sky1} />
          <stop offset="100%" stopColor={p.sky2} />
        </linearGradient>
        <linearGradient id={`body-${tone}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.body} stopOpacity="0.95" />
          <stop offset="100%" stopColor={p.body} />
        </linearGradient>
      </defs>
      {/* sky */}
      <rect width="400" height="160" fill={`url(#sky-${tone})`} />
      {/* mountains - chihuahua sierra */}
      <path d="M0 160 L60 120 L110 145 L160 105 L220 140 L280 115 L340 135 L400 110 L400 160 Z" fill={p.ground} opacity="0.55" />
      <path d="M0 160 L40 140 L100 152 L150 130 L210 150 L260 138 L320 148 L400 132 L400 160 Z" fill={p.ground} opacity="0.85" />
      {/* ground */}
      <rect x="0" y="160" width="400" height="80" fill={p.ground} />
      {/* car silhouette */}
      <g transform="translate(60, 110)">
        {/* shadow */}
        <ellipse cx="140" cy="100" rx="130" ry="6" fill="rgba(0,0,0,0.25)" />
        {/* body */}
        <path d="M10 80 Q15 55 50 50 L90 35 Q120 22 160 22 L200 24 Q230 28 250 50 L275 55 Q282 62 280 82 L275 88 L240 88 Q236 75 224 75 Q212 75 208 88 L70 88 Q66 75 54 75 Q42 75 38 88 L18 88 Q10 86 10 80 Z" fill={`url(#body-${tone})`} />
        {/* windows */}
        <path d="M70 50 L100 32 Q125 26 155 26 L195 28 Q215 30 232 50 Z" fill="#a0b4c4" opacity="0.85" />
        <path d="M75 50 L100 36 L155 32 L155 50 Z" fill={p.body} opacity="0.4" />
        <line x1="155" y1="30" x2="155" y2="50" stroke={p.body} strokeWidth="1.2" opacity="0.5" />
        {/* accent line */}
        <rect x="20" y="68" width="240" height="2" fill={p.accent} opacity="0.6" />
        {/* wheels */}
        <circle cx="62" cy="88" r="14" fill={p.body} />
        <circle cx="62" cy="88" r="6" fill="#888" />
        <circle cx="216" cy="88" r="14" fill={p.body} />
        <circle cx="216" cy="88" r="6" fill="#888" />
        {/* headlight */}
        <rect x="270" y="62" width="6" height="6" rx="1" fill={p.accent} />
      </g>
      {/* plate watermark */}
      <text x="380" y="232" fontSize="9" fill="rgba(255,255,255,0.55)" textAnchor="end" fontFamily="ui-monospace, Menlo, monospace" letterSpacing="1">{plate}</text>
    </svg>
  );
};

// ─── Logo ───────────────────────────────────────────────────────
const Logo = ({ variant = 'dark', height = 36 }) => {
  // Single transparent logo (symbol + wordmark stacked).
  // Works on light backgrounds. For dark backgrounds, the wordmark
  // turns invisible, so we wrap it in a small rounded card-on-dark.
  const img = <img src="assets/logo-transparent.png" alt="LoteCUU" style={{ height, width: 'auto', display: 'block' }} />;
  if (variant === 'light') {
    // dark-bg variant: render inside a soft white plate
    return (
      <span style={{
        display: 'inline-flex',
        background: '#FAFAF7',
        padding: '8px 14px',
        borderRadius: 10,
      }}>
        {img}
      </span>
    );
  }
  return img;
};

// Compact mark only (symbol)
const LogoMark = ({ size = 28 }) => (
  <img src="assets/logo-transparent.png" alt="" style={{ height: size, width: 'auto', display: 'block', objectFit: 'contain', objectPosition: 'top' }} />
);

// ─── Status pill ────────────────────────────────────────────────
const Status = ({ kind }) => {
  const map = {
    available: { cls: 'lc-status--available', label: 'Disponible' },
    reserved:  { cls: 'lc-status--reserved',  label: 'Apartado' },
    sold:      { cls: 'lc-status--sold',      label: 'Vendido' },
  };
  const m = map[kind];
  return (
    <span className={`lc-status ${m.cls}`}>
      <span className="dot" />
      {m.label}
    </span>
  );
};

const FeaturedPill = () => (
  <span className="lc-featured">
    <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.5 7h7.5l-6 4.5 2.3 7L12 16.5 5.7 20.5 8 13.5 2 9h7.5z"/></svg>
    Destacado
  </span>
);

// ─── Avatar ─────────────────────────────────────────────────────
const Avatar = ({ initials, size = 22 }) => (
  <span className="lc-avatar" style={{ width: size, height: size, fontSize: size <= 24 ? 10 : 14 }}>
    {initials}
  </span>
);

// ─── Icon set ───────────────────────────────────────────────────
const Icon = ({ name, size = 16, color = 'currentColor' }) => {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'search':   return <svg {...props}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>;
    case 'chevron':  return <svg {...props}><path d="M6 9l6 6 6-6"/></svg>;
    case 'whatsapp': return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M17.6 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2c-.2-.5-.5-.4-.7-.4h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5 4.4 1.7.7 2.4.8 3.3.7.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.2-.2-.5-.3zM12 2C6.5 2 2 6.5 2 12c0 1.7.5 3.4 1.3 4.8L2 22l5.3-1.4c1.4.8 3 1.2 4.7 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z"/></svg>;
    case 'calendar': return <svg {...props}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>;
    case 'gauge':    return <svg {...props}><path d="M12 14l4-4"/><circle cx="12" cy="14" r="9"/><path d="M3 14a9 9 0 0118 0"/></svg>;
    case 'gear':     return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 00-.1-1.2l2-1.6-2-3.4-2.4.8a7 7 0 00-2-1.2L14 3h-4l-.5 2.4a7 7 0 00-2 1.2l-2.4-.8-2 3.4 2 1.6A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-.8a7 7 0 002 1.2L10 21h4l.5-2.4a7 7 0 002-1.2l2.4.8 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z"/></svg>;
    case 'fuel':     return <svg {...props}><path d="M3 21V5a2 2 0 012-2h7a2 2 0 012 2v16"/><path d="M3 13h11"/><path d="M14 8l3 3v8a2 2 0 01-2 2"/><path d="M17 5l2 2"/></svg>;
    case 'car':      return <svg {...props}><path d="M5 17h14M3 13l2-5a2 2 0 012-1.5h10a2 2 0 012 1.5l2 5"/><path d="M3 13v4h18v-4"/><circle cx="7" cy="17" r="1.5"/><circle cx="17" cy="17" r="1.5"/></svg>;
    case 'paint':    return <svg {...props}><path d="M5 3h14v6H5z"/><path d="M5 9v3a2 2 0 002 2h2v6a2 2 0 002 2 2 2 0 002-2v-6h2a2 2 0 002-2V9"/></svg>;
    case 'check':    return <svg {...props}><path d="M5 12l4 4 10-10"/></svg>;
    case 'pin':      return <svg {...props}><path d="M12 22s7-7 7-12a7 7 0 10-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>;
    case 'share':    return <svg {...props}><path d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v14"/></svg>;
    case 'arrow-right': return <svg {...props}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case 'arrow-left':  return <svg {...props}><path d="M19 12H5M11 6l-6 6 6 6"/></svg>;
    case 'plus':     return <svg {...props}><path d="M12 5v14M5 12h14"/></svg>;
    case 'menu':     return <svg {...props}><path d="M4 7h16M4 12h16M4 17h16"/></svg>;
    case 'close':    return <svg {...props}><path d="M6 6l12 12M18 6L6 18"/></svg>;
    case 'sliders':  return <svg {...props}><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg>;
    default:         return null;
  }
};

// ─── Sellers ────────────────────────────────────────────────────
// Each seller has a brand logo (rendered as a stylized SVG token) +
// metadata. The logo is a generated visual identity — small geometric
// mark + custom typography. Real implementations would replace these
// with uploaded brand assets via the admin panel.
const SELLERS = {
  'autos-lira': {
    id: 'autos-lira',
    name: 'Autos Lira',
    initials: 'AL',
    tagline: 'Camionetas y pickups · Más de 12 años en Chihuahua',
    location: 'Av. Tecnológico 4200, Chihuahua, Chih.',
    phone: '+52 614 123 4567',
    whatsapp: '+52 614 123 4567',
    hours: 'Lun–Sáb 9:00–19:00',
    rating: 4.8,
    reviewCount: 142,
    yearsActive: 12,
    verified: true,
    inventory: 24,
    sold: 380,
    // Brand identity
    logoColor: '#1A4D6B',
    logoAccent: '#E56A2E',
    logoStyle: 'shield', // shield, badge, mark, monogram
    coverTone: 'sunset',
    description: 'Lote especializado en camionetas, pickups y SUVs. Todas las unidades pasan por revisión mecánica de 80 puntos antes de ser publicadas. Aceptamos cambios y damos facilidades de pago.',
  },
  'motors-reyes': {
    id: 'motors-reyes',
    name: 'Motors Reyes',
    initials: 'MR',
    tagline: 'Sedanes y compactos seminuevos',
    location: 'Calle Vicente Guerrero 1820, Chihuahua, Chih.',
    phone: '+52 614 222 3344',
    whatsapp: '+52 614 222 3344',
    hours: 'Lun–Vie 10:00–18:00',
    rating: 4.6,
    reviewCount: 89,
    yearsActive: 7,
    verified: true,
    inventory: 14,
    sold: 210,
    logoColor: '#2B3A4A',
    logoAccent: '#C8392B',
    logoStyle: 'badge',
    coverTone: 'desert',
    description: 'Compra-venta de autos seminuevos con factura original. Especialistas en sedanes japoneses y compactos.',
  },
  'carros-valle': {
    id: 'carros-valle',
    name: 'Carros del Valle',
    initials: 'CV',
    tagline: 'Tu próximo auto, sin vueltas',
    location: 'Periférico de la Juventud 8910, Chihuahua, Chih.',
    phone: '+52 614 555 9988',
    whatsapp: '+52 614 555 9988',
    hours: 'Lun–Dom 9:00–20:00',
    rating: 4.9,
    reviewCount: 217,
    yearsActive: 5,
    verified: true,
    inventory: 31,
    sold: 295,
    logoColor: '#0F4D3F',
    logoAccent: '#E8A93C',
    logoStyle: 'monogram',
    coverTone: 'cool',
    description: 'El lote más grande del Periférico. Inventario amplio en SUVs, sedanes y compactos. Trámites en 24 horas.',
  },
};

// Brand-logo renderer for each seller. Generates a distinct visual
// identity per logoStyle so each seller feels like a different brand.
const SellerLogo = ({ sellerId, size = 56, variant = 'full' }) => {
  const s = SELLERS[sellerId];
  if (!s) return null;
  const { logoColor, logoAccent, logoStyle, name, initials } = s;

  // Mark variations (the symbol)
  const mark = (() => {
    if (logoStyle === 'shield') {
      return (
        <svg viewBox="0 0 64 64" width={size} height={size}>
          <path d="M32 4 L56 14 V34 C56 48 44 58 32 60 C20 58 8 48 8 34 V14 Z" fill={logoColor}/>
          <path d="M20 26 L32 34 L44 26 L44 38 L32 46 L20 38 Z" fill="#fff"/>
          <rect x="28" y="16" width="8" height="3" fill={logoAccent}/>
        </svg>
      );
    }
    if (logoStyle === 'badge') {
      return (
        <svg viewBox="0 0 64 64" width={size} height={size}>
          <circle cx="32" cy="32" r="28" fill={logoColor}/>
          <circle cx="32" cy="32" r="22" fill="none" stroke={logoAccent} strokeWidth="1.5"/>
          <text x="32" y="40" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="700" fontFamily="Manrope, sans-serif" letterSpacing="-0.5">{initials}</text>
        </svg>
      );
    }
    // monogram
    return (
      <svg viewBox="0 0 64 64" width={size} height={size}>
        <rect x="4" y="4" width="56" height="56" rx="10" fill={logoColor}/>
        <path d="M14 50 L14 14 L24 14 L24 40 L42 40 L42 50 Z" fill="#fff"/>
        <rect x="44" y="14" width="6" height="36" fill={logoAccent}/>
      </svg>
    );
  })();

  if (variant === 'mark') return mark;

  // Full lockup: mark + wordmark
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: Math.round(size * 0.22) }}>
      {mark}
      <span style={{
        display: 'flex', flexDirection: 'column',
        fontFamily: 'Manrope, sans-serif',
        lineHeight: 1.05,
      }}>
        <span style={{
          fontSize: Math.round(size * 0.34),
          fontWeight: 600,
          color: logoColor,
          letterSpacing: '-0.02em',
        }}>{name}</span>
        <span style={{
          fontSize: Math.round(size * 0.16),
          color: logoAccent,
          textTransform: 'uppercase',
          letterSpacing: '0.16em',
          fontWeight: 500,
          marginTop: 2,
        }}>Lote oficial · CUU</span>
      </span>
    </span>
  );
};

// Helper: get full seller record
const getSeller = (id) => SELLERS[id];

// ─── Sample data ────────────────────────────────────────────────
const CARS = [
  {
    id: 'toyota-hilux-2022',
    title: 'Toyota Hilux 2022',
    trim: 'TRD Sport',
    price: 485000,
    year: 2022,
    km: 38000,
    transmission: 'Automático',
    type: 'Pickup',
    fuel: 'Diesel',
    color: 'Blanco',
    condition: 'Muy bueno',
    status: 'available',
    featured: true,
    tone: 'sunset',
    plate: 'GVR-721-A',
    seller: { id: 'autos-lira', name: 'Autos Lira', initials: 'AL', location: 'Av. Tecnológico, Chihuahua' },
    description: 'Hilux en excelente estado, servicio al corriente en agencia, llantas nuevas, factura original. Único dueño, no fumador. Acepto cambio o auto a cuenta.',
  },
  {
    id: 'nissan-versa-2021',
    title: 'Nissan Versa 2021',
    trim: 'Advance',
    price: 198000,
    year: 2021,
    km: 52000,
    transmission: 'Automático',
    type: 'Sedán',
    status: 'available',
    tone: 'desert',
    plate: 'JLM-441-B',
    seller: { id: 'motors-reyes', name: 'Motors Reyes', initials: 'MR' },
  },
  {
    id: 'honda-crv-2020',
    title: 'Honda CR-V 2020',
    type: 'SUV',
    status: 'reserved',
    tone: 'cool',
    plate: 'KAS-908-C',
    seller: { id: 'autos-lira', name: 'Autos Lira', initials: 'AL' },
  },
  {
    id: 'chevrolet-trax-2023',
    title: 'Chevrolet Trax 2023',
    trim: 'LT',
    price: 285000,
    year: 2023,
    km: 11000,
    transmission: 'Automático',
    type: 'SUV',
    status: 'available',
    tone: 'overcast',
    plate: 'BLR-156-D',
    seller: { id: 'carros-valle', name: 'Carros del Valle', initials: 'CV' },
  },
  {
    id: 'ford-ranger-2019',
    title: 'Ford Ranger 2019',
    transmission: 'Manual',
    type: 'Pickup',
    status: 'sold',
    tone: 'twilight',
    plate: 'TRD-330-E',
    seller: { id: 'motors-reyes', name: 'Motors Reyes', initials: 'MR' },
  },
  {
    id: 'mazda3-2022',
    title: 'Mazda 3 2022',
    trim: 'i Grand Touring',
    price: 312000,
    year: 2022,
    km: 28500,
    transmission: 'Automático',
    type: 'Sedán',
    fuel: 'Gasolina',
    status: 'available',
    tone: 'night',
    plate: 'PHX-885-F',
    seller: { id: 'carros-valle', name: 'Carros del Valle', initials: 'CV' },
  },
];

// Format MXN currency
const fmtPrice = (n) => n
  ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
  : null;

const fmtKm = (n) => n
  ? new Intl.NumberFormat('es-MX').format(n) + ' km'
  : null;

// expose globals
Object.assign(window, {
  CarPlaceholder, Logo, LogoMark, SellerLogo, Status, FeaturedPill, Avatar, Icon,
  CARS, SELLERS, getSeller, fmtPrice, fmtKm,
});
