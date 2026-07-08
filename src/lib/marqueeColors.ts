export interface MarqueeColor {
  id: string
  label: string
  hex: string
  shift?: boolean
}

export const MARQUEE_COLORS: MarqueeColor[] = [
  { id: 'warm-white', label: 'Warm White', hex: '#FAE8B4' },
  { id: 'red', label: 'Red', hex: '#FF5A5A' },
  { id: 'pink', label: 'Pink', hex: '#FF7FB4' },
  { id: 'blue', label: 'Blue', hex: '#5AA9FF' },
  { id: 'green', label: 'Green', hex: '#5EDB8C' },
  { id: 'amber', label: 'Amber', hex: '#FFB454' },
  { id: 'purple', label: 'Purple', hex: '#9B72CF' },
  { id: 'color-shift', label: 'Color-Shift', hex: '#FAE8B4', shift: true },
]

export const DEFAULT_COLOR = MARQUEE_COLORS[0]
