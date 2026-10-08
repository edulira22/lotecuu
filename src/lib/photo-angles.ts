/**
 * Photo "poses" a seller can upload for each vehicle. The order of this list
 * is the order photos appear in the public gallery (after the cover).
 */
export type AngleGroup = 'exterior' | 'interior' | 'detalles'

export const PHOTO_ANGLES = [
  { key: 'tres_cuartos', label: '¾ frontal',         group: 'exterior' },
  { key: 'frontal',      label: 'Frontal',           group: 'exterior' },
  { key: 'lateral_izq',  label: 'Lateral izquierdo', group: 'exterior' },
  { key: 'lateral_der',  label: 'Lateral derecho',   group: 'exterior' },
  { key: 'trasera',      label: 'Trasera',           group: 'exterior' },
  { key: 'superior',     label: 'Vista superior',    group: 'exterior' },
  { key: 'tablero',      label: 'Tablero',           group: 'interior' },
  { key: 'asientos_del', label: 'Asientos delanteros', group: 'interior' },
  { key: 'asientos_tra', label: 'Asientos traseros', group: 'interior' },
  { key: 'cajuela',      label: 'Cajuela',           group: 'interior' },
  { key: 'motor',        label: 'Motor',             group: 'detalles' },
  { key: 'rines',        label: 'Rines y llantas',   group: 'detalles' },
  { key: 'odometro',     label: 'Odómetro',          group: 'detalles' },
  { key: 'detalle',      label: 'Detalles',          group: 'detalles' },
] as const satisfies readonly { key: string; label: string; group: AngleGroup }[]

export type PhotoAngle = (typeof PHOTO_ANGLES)[number]['key']

export const ANGLE_GROUPS: { key: AngleGroup; label: string }[] = [
  { key: 'exterior', label: 'Exterior' },
  { key: 'interior', label: 'Interior' },
  { key: 'detalles', label: 'Detalles' },
]

const ANGLE_INDEX = new Map<string, number>(PHOTO_ANGLES.map((a, i) => [a.key, i]))
const ANGLE_META = new Map<string, (typeof PHOTO_ANGLES)[number]>(PHOTO_ANGLES.map((a) => [a.key, a]))

export function angleLabel(angle: string | null | undefined): string | null {
  return angle ? ANGLE_META.get(angle)?.label ?? null : null
}

export function angleGroup(angle: string | null | undefined): AngleGroup | null {
  return angle ? ANGLE_META.get(angle)?.group ?? null : null
}

interface SortablePhoto {
  is_cover: boolean
  sort_order: number
  angle?: string | null
}

/** Cover first, then posed photos in PHOTO_ANGLES order, then the rest by sort_order. */
export function sortPhotos<T extends SortablePhoto>(photos: T[]): T[] {
  const rank = (p: T) => {
    if (p.is_cover) return -1
    const i = p.angle ? ANGLE_INDEX.get(p.angle) : undefined
    return i ?? PHOTO_ANGLES.length
  }
  return [...photos].sort((a, b) => rank(a) - rank(b) || a.sort_order - b.sort_order)
}
