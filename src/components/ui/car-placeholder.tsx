import { cn } from '@/lib/utils'

type Tone = 'sunset' | 'desert' | 'twilight' | 'cool' | 'overcast' | 'night'

const TONES: Record<Tone, { from: string; to: string; fg: string }> = {
  sunset:   { from: '#E8C5A0', to: '#C4895A', fg: '#A0623A' },
  desert:   { from: '#D4C9A8', to: '#B0A07A', fg: '#8A7A55' },
  twilight: { from: '#B0A8C8', to: '#7A6EA0', fg: '#5A4E80' },
  cool:     { from: '#A8C4D8', to: '#5A8FA8', fg: '#3A6F88' },
  overcast: { from: '#C8CDD4', to: '#9AA4AE', fg: '#7A848E' },
  night:    { from: '#6A7480', to: '#2E3840', fg: '#1E2830' },
}

const TONES_ORDER: Tone[] = ['sunset', 'desert', 'twilight', 'cool', 'overcast', 'night']

export function getPlaceholderTone(seed: string): Tone {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return TONES_ORDER[hash % TONES_ORDER.length]
}

interface CarPlaceholderProps {
  tone?: Tone
  seed?: string
  className?: string
}

export function CarPlaceholder({ tone, seed, className }: CarPlaceholderProps) {
  const resolvedTone = tone ?? (seed ? getPlaceholderTone(seed) : 'cool')
  const { from, to, fg } = TONES[resolvedTone]

  return (
    <div
      className={cn('w-full h-full flex items-center justify-center', className)}
      style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
      aria-hidden
    >
      <svg
        viewBox="0 0 120 60"
        width="60%"
        height="60%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.55 }}
      >
        {/* Car silhouette */}
        <path
          d="M8 40 L8 34 L20 22 L44 18 L70 18 L88 24 L110 34 L112 40 L112 46 L8 46 Z"
          fill={fg}
        />
        {/* Windshield */}
        <path
          d="M22 34 L34 22 L70 22 L82 34 Z"
          fill="white"
          opacity="0.25"
        />
        {/* Wheels */}
        <circle cx="32" cy="46" r="9" fill={fg} stroke="white" strokeWidth="2" opacity="0.8" />
        <circle cx="32" cy="46" r="4" fill="white" opacity="0.3" />
        <circle cx="88" cy="46" r="9" fill={fg} stroke="white" strokeWidth="2" opacity="0.8" />
        <circle cx="88" cy="46" r="4" fill="white" opacity="0.3" />
        {/* Headlights */}
        <rect x="108" y="35" width="4" height="6" rx="1" fill="white" opacity="0.6" />
        <rect x="8" y="35" width="4" height="6" rx="1" fill="white" opacity="0.4" />
      </svg>
    </div>
  )
}
