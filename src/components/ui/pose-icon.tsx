import type { PhotoAngle } from '@/lib/photo-angles'

const SIDE_BODY =
  'M5 27v-5c0-2.2 1.4-3.4 3.4-3.7L19 17l6.4-6.4c1.2-1.2 2.7-1.6 4.4-1.6H42c1.8 0 3.3.6 4.5 1.9L52 17l5.4.9c2 .4 3.6 1.9 3.6 4.1v5'
const SIDE_WINDOWS = 'M22 17l5.5-5.2h15.8L48.5 17z'

function SideCar({ flip = false }: { flip?: boolean }) {
  return (
    <g transform={flip ? 'translate(66 0) scale(-1 1)' : undefined}>
      <path d={SIDE_BODY} />
      <path d={SIDE_WINDOWS} />
      <path d="M11 27h0.5M22 27h22M55 27h1" />
      <circle cx="16.5" cy="27.5" r="5" />
      <circle cx="49.5" cy="27.5" r="5" />
    </g>
  )
}

const ICONS: Record<PhotoAngle, React.ReactNode> = {
  tres_cuartos: (
    <g>
      <path d="M5 28v-5c0-2 1.2-3.2 3-3.6L17 18l6-6.2c1-1 2.4-1.6 3.9-1.6H38c1.6 0 3 .6 4 1.8L47 18" />
      <path d="M47 18l9 1.6c2 .4 3 1.8 3 3.6V29l-12 1.5z" />
      <path d="M20 18l5-5h13l4.5 5z" />
      <path d="M50 22.5l6 .8" />
      <path d="M47 18v12.5" />
      <ellipse cx="14" cy="28.5" rx="4.2" ry="4.8" />
      <ellipse cx="41.5" cy="30" rx="4.2" ry="4.8" />
    </g>
  ),
  frontal: (
    <g>
      <path d="M18 15l4-7.5h20l4 7.5" />
      <rect x="10" y="15" width="44" height="14" rx="3" />
      <rect x="13.5" y="18.5" width="8" height="3" rx="1.2" />
      <rect x="42.5" y="18.5" width="8" height="3" rx="1.2" />
      <rect x="26" y="20" width="12" height="5" rx="1.2" />
      <path d="M13 29v4h5v-4M46 29v4h5v-4M10 16l-3.5-1.2" />
      <path d="M54 16l3.5-1.2" />
    </g>
  ),
  lateral_izq: <SideCar flip />,
  lateral_der: <SideCar />,
  trasera: (
    <g>
      <path d="M18 15l4-7.5h20l4 7.5" />
      <path d="M23.5 13l2-3.5h13l2 3.5z" />
      <rect x="10" y="15" width="44" height="14" rx="3" />
      <rect x="12.5" y="18.5" width="11" height="3" rx="1.2" />
      <rect x="40.5" y="18.5" width="11" height="3" rx="1.2" />
      <rect x="27" y="22" width="10" height="4.5" rx="1" />
      <path d="M13 29v4h5v-4M46 29v4h5v-4" />
    </g>
  ),
  superior: (
    <g>
      <rect x="7" y="9" width="50" height="22" rx="9" />
      <rect x="23" y="12.5" width="19" height="15" rx="3" />
      <path d="M20 12.5c-2.5 4-2.5 11 0 15M45 12.5c2.5 4 2.5 11 0 15" />
      <path d="M13 9.5v-2M13 32.5v-2M51 9.5v-2M51 32.5v-2" />
    </g>
  ),
  tablero: (
    <g>
      <path d="M5 14c8-6 46-6 54 0" />
      <circle cx="32" cy="25" r="10" />
      <circle cx="32" cy="25" r="3" />
      <path d="M22 25h7M35 25h7M32 28v7" />
      <path d="M8 18h8M48 18h8" />
    </g>
  ),
  asientos_del: (
    <g>
      <rect x="22" y="3.5" width="9" height="5" rx="2" />
      <path d="M22.5 10.5h8.5c1.5 0 2.4 1.2 2.1 2.6L30.5 24H42c2.2 0 3.5 1.4 3.5 3.5V30H23.5c-2 0-3.2-1.4-3-3.2l.7-14.6c.1-1 .6-1.7 1.3-1.7z" />
      <path d="M26 30v5M42 30v5" />
    </g>
  ),
  asientos_tra: (
    <g>
      <path d="M9 21V10c0-2 1.4-3.5 3.5-3.5h39C53.6 6.5 55 8 55 10v11" />
      <path d="M6 21h52v6c0 1.7-1.3 3-3 3H9c-1.7 0-3-1.3-3-3z" />
      <path d="M27 7v14M37 7v14" />
      <path d="M10 30v4M54 30v4" />
    </g>
  ),
  cajuela: (
    <g>
      <rect x="9" y="19" width="46" height="12" rx="3" />
      <path d="M13 19l9-11h20l9 11" strokeDasharray="2.5 2.5" />
      <path d="M20 19L14 5.5h36L44 19" />
      <rect x="22" y="22.5" width="9" height="6" rx="1" />
      <rect x="33" y="24" width="8" height="4.5" rx="1" />
      <path d="M12 31v3.5h5V31M47 31v3.5h5V31" />
    </g>
  ),
  motor: (
    <g>
      <rect x="16" y="14" width="32" height="15" rx="2" />
      <path d="M21 14v-4h7v4M36 14v-4h7v4" />
      <path d="M16 19h-4v5h4M48 18h4l3-3M48 25h4l3 3" />
      <path d="M22 29v4h20v-4" />
      <path d="M24 19.5h16M24 23.5h16" />
    </g>
  ),
  rines: (
    <g>
      <circle cx="32" cy="20" r="15" />
      <circle cx="32" cy="20" r="10.5" />
      <circle cx="32" cy="20" r="3" />
      <path d="M32 17V9.5M34.9 19.1l7.1-2.3M33.8 22.4l4.4 6M30.2 22.4l-4.4 6M29.1 19.1L22 16.8" />
    </g>
  ),
  odometro: (
    <g>
      <path d="M11 31a21 21 0 1 1 42 0" />
      <path d="M14.5 21l2.7 1.4M22 12.6l1.6 2.6M32 9.5v3M42 12.6l-1.6 2.6M49.5 21l-2.7 1.4" />
      <path d="M32 31l9-11" />
      <circle cx="32" cy="31" r="2.2" />
      <rect x="25" y="34" width="14" height="4" rx="1" />
    </g>
  ),
  detalle: (
    <g>
      <circle cx="28" cy="18" r="11" />
      <path d="M36 26l11 10" />
      <path d="M23 18h10M28 13v10" strokeOpacity="0.55" />
    </g>
  ),
}

export function PoseIcon({
  angle,
  size = 64,
  className,
}: {
  angle: PhotoAngle
  size?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={(size * 40) / 66}
      viewBox="0 0 66 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {ICONS[angle]}
    </svg>
  )
}
