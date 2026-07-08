export type Category = 'letter' | 'number' | 'uplighting' | 'stage'
export type Finish = 'white' | 'black'

export interface InventoryItem {
  id: string
  name: string
  category: Category
  finish: Finish | null
  price: number | null
  qtyOwned: number | null
  unlimited: boolean
  imageSlot: string
}

const LETTER_PRICE = 70
const LETTER_QTY = 1

const NUMBER_PRICE = 70
const NUMBER_QTY = 1

const LETTERS: InventoryItem[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((ch) => ({
  id: `letter-${ch}`,
  name: ch,
  category: 'letter',
  finish: 'white',
  price: LETTER_PRICE,
  qtyOwned: LETTER_QTY,
  unlimited: false,
  imageSlot: `/inventory/letters/${ch}.jpg`,
}))

const NUMBERS: InventoryItem[] = '0123456789'
  .split('')
  .flatMap((digit) =>
    (['black', 'white'] as Finish[]).map((finish) => ({
      id: `number-${digit}-${finish}`,
      name: digit,
      category: 'number' as Category,
      finish,
      price: NUMBER_PRICE,
      qtyOwned: NUMBER_QTY,
      unlimited: false,
      imageSlot: `/inventory/numbers/${digit}-${finish}.jpg`,
    })),
  )

// Currently 6 fixtures owned; growing to 10 soon — update qtyOwned when the rest arrive.
const LED_UPLIGHTING: InventoryItem = {
  id: 'led-uplighting',
  name: 'LED Uplighting',
  category: 'uplighting',
  finish: null,
  price: null,
  qtyOwned: 6,
  unlimited: false,
  imageSlot: '/inventory/led-uplighting.jpg',
}

const STAGE: InventoryItem = {
  id: 'stage',
  name: 'Stage',
  category: 'stage',
  finish: null,
  price: null,
  qtyOwned: 1,
  unlimited: false,
  imageSlot: '/inventory/stage.jpg',
}

const ARCH_3D: InventoryItem = {
  id: 'arch-3d',
  name: '3D Arch',
  category: 'stage',
  finish: null,
  price: null,
  qtyOwned: 2,
  unlimited: false,
  imageSlot: '/inventory/arch-3d.jpg',
}

export const INVENTORY: InventoryItem[] = [
  ...LETTERS,
  ...NUMBERS,
  LED_UPLIGHTING,
  STAGE,
  ARCH_3D,
]

export function getItemsByCategory(category: Category): InventoryItem[] {
  return INVENTORY.filter((item) => item.category === category)
}

export function getLetterPrice(): number {
  return LETTER_PRICE
}

export function getNumberPrice(): number {
  return NUMBER_PRICE
}

export function formatPrice(price: number | null): string {
  return price === null ? 'Ask for pricing' : `$${price}`
}

/** Price for a single marquee character (letter or digit), regardless of finish. Returns null if the character isn't priced (spaces, symbols). */
export function getCharPrice(char: string): number | null {
  if (/^[A-Za-z]$/.test(char)) return LETTER_PRICE
  if (/^[0-9]$/.test(char)) return NUMBER_PRICE
  return null
}
