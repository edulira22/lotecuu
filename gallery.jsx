// LoteCUU — Filmstrip gallery
// A unique car-photo gallery: the photos travel along a horizontal "film reel"
// with side peeks of prev/next, sprocket holes top & bottom (subtle), and a
// soft cinematic vignette on inactive frames. Click a peeking frame to glide
// it center; drag horizontally on touch; keyboard arrows on focus.
// The mechanic is intuitive (it's a slider) but the chrome makes it special.

function FilmstripGallery({ car, mode = 'desktop' }) {
  const tones = ['sunset', 'desert', 'twilight', 'overcast', 'cool'];
  const photos = tones.map((t, i) => ({ tone: t, plate: car.plate || 'CUU', label: `0${i + 1}` }));
  const [active, setActive] = React.useState(0);
  const isMobile = mode === 'mobile';

  // Drag state
  const dragRef = React.useRef({ startX: 0, dx: 0, dragging: false });
  const [dx, setDx] = React.useState(0);

  const total = photos.length;
  const goto = (i) => setActive(((i % total) + total) % total);

  // Geometry
  const frameH = isMobile ? 280 : 460;
  const frameW = isMobile ? 320 : 720; // active frame width
  const peekW = isMobile ? 38 : 110;   // visible width of side frames
  const gap = isMobile ? 10 : 16;
  const stride = frameW + gap;

  // Touch / pointer drag
  const onPointerDown = (e) => {
    dragRef.current.startX = e.clientX;
    dragRef.current.dragging = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragRef.current.dragging) return;
    const d = e.clientX - dragRef.current.startX;
    dragRef.current.dx = d;
    setDx(d);
  };
  const onPointerUp = (e) => {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    const d = dragRef.current.dx;
    if (Math.abs(d) > stride * 0.18) {
      goto(active + (d < 0 ? 1 : -1));
    }
    dragRef.current.dx = 0;
    setDx(0);
  };

  // Keyboard
  const onKey = (e) => {
    if (e.key === 'ArrowLeft') goto(active - 1);
    if (e.key === 'ArrowRight') goto(active + 1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, userSelect: 'none' }}>
      {/* Eyebrow: cinematic counter */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 18px' : 0,
        fontFamily: 'ui-monospace, Menlo, monospace',
        fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.18em', textTransform: 'uppercase',
      }}>
        <span>Carrete · {photos[active].label} de 0{total}</span>
        <span>{car.plate}</span>
      </div>

      {/* Filmstrip viewport */}
      <div
        tabIndex={0}
        onKeyDown={onKey}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          position: 'relative',
          height: frameH + 28, // 14 sprocket band top + bottom
          background: '#0E1218',
          overflow: 'hidden',
          cursor: dragRef.current.dragging ? 'grabbing' : 'grab',
          borderRadius: isMobile ? 0 : 14,
          touchAction: 'pan-y',
          outline: 'none',
        }}
      >
        {/* Sprocket holes — top & bottom rows */}
        {[14, frameH + 14].map((y, idx) => (
          <div key={idx} style={{
            position: 'absolute', left: 0, right: 0, top: idx === 0 ? 0 : 'auto', bottom: idx === 1 ? 0 : 'auto',
            height: 14,
            background: 'repeating-linear-gradient(90deg, transparent 0 14px, rgba(255,255,255,0.08) 14px 22px, transparent 22px 36px)',
            borderTop: idx === 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            borderBottom: idx === 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
          }} />
        ))}

        {/* Frames track */}
        <div style={{
          position: 'absolute', top: 14, bottom: 14, left: '50%',
          display: 'flex', gap,
          transform: `translateX(calc(-${active * stride}px - ${frameW / 2}px + ${dx}px))`,
          transition: dragRef.current.dragging ? 'none' : 'transform 0.55s cubic-bezier(.2,.8,.2,1)',
        }}>
          {photos.map((p, i) => {
            const isActive = i === active;
            return (
              <button
                key={i}
                onClick={() => !dragRef.current.dragging && goto(i)}
                style={{
                  width: frameW,
                  height: '100%',
                  flexShrink: 0,
                  border: 'none',
                  padding: 0,
                  cursor: isActive ? 'default' : 'pointer',
                  background: 'transparent',
                  position: 'relative',
                  borderRadius: 6,
                  overflow: 'hidden',
                  outline: '1px solid rgba(255,255,255,0.08)',
                  transition: 'filter 0.4s, transform 0.4s',
                  filter: isActive ? 'none' : 'saturate(0.45) brightness(0.65)',
                  transform: isActive ? 'scale(1)' : 'scale(0.96)',
                }}>
                <CarPlaceholder tone={p.tone} plate={p.plate} />
                {/* Vignette on inactive */}
                {!isActive && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(ellipse at center, transparent 50%, rgba(14,18,24,0.55) 100%)',
                  }} />
                )}
                {/* Frame number tag */}
                <div style={{
                  position: 'absolute', top: 10, left: 10,
                  fontFamily: 'ui-monospace, Menlo, monospace',
                  fontSize: 10, color: '#fff', opacity: 0.75,
                  letterSpacing: '0.15em',
                  background: 'rgba(0,0,0,0.35)',
                  padding: '3px 7px', borderRadius: 3,
                }}>{p.label}</div>
              </button>
            );
          })}
        </div>

        {/* Side gradient tunnels (only desktop, where peeks are big enough) */}
        {!isMobile && (
          <>
            <div style={{
              position: 'absolute', top: 14, bottom: 14, left: 0, width: peekW,
              background: 'linear-gradient(90deg, rgba(14,18,24,0.85), transparent)',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', top: 14, bottom: 14, right: 0, width: peekW,
              background: 'linear-gradient(270deg, rgba(14,18,24,0.85), transparent)',
              pointerEvents: 'none',
            }} />
          </>
        )}

        {/* Nav buttons */}
        <button onClick={() => goto(active - 1)} style={navBtn(isMobile, 'left')}>
          <Icon name="arrow-left" size={16} color="#fff" />
        </button>
        <button onClick={() => goto(active + 1)} style={navBtn(isMobile, 'right')}>
          <Icon name="arrow-right" size={16} color="#fff" />
        </button>
      </div>

      {/* Frame indicator strip — minimal dots in monospace bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: isMobile ? '0 18px' : 0,
        justifyContent: 'center',
      }}>
        {photos.map((_, i) => (
          <button
            key={i}
            onClick={() => goto(i)}
            aria-label={`Foto ${i + 1}`}
            style={{
              width: i === active ? 28 : 8,
              height: 4,
              borderRadius: 999,
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              background: i === active ? 'var(--orange)' : 'rgba(30,35,43,0.18)',
              transition: 'all 0.3s cubic-bezier(.2,.8,.2,1)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

function navBtn(isMobile, side) {
  return {
    position: 'absolute',
    top: '50%', transform: 'translateY(-50%)',
    [side]: isMobile ? 8 : 18,
    width: 40, height: 40, borderRadius: '50%',
    background: 'rgba(255,255,255,0.12)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.18)',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 5,
  };
}

window.FilmstripGallery = FilmstripGallery;
