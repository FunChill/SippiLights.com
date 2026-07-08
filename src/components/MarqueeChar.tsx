import { motion } from 'motion/react'
import type { Finish } from '../data/inventory'

interface MarqueeCharProps {
  char: string
  index: number
  colorHex: string
  colorShift?: boolean
  isNumber: boolean
  finish: Finish
}

export function MarqueeChar({
  char,
  index,
  colorHex,
  colorShift,
  isNumber,
  finish,
}: MarqueeCharProps) {
  if (char === ' ') {
    return <div className="w-4 shrink-0 sm:w-6" aria-hidden="true" />
  }

  const housingBg = isNumber && finish === 'black' ? '#0f0e0d' : '#2e2b27'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay: index * 0.03, ease: 'backOut' }}
      className={`relative flex h-14 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 sm:h-20 sm:w-16 ${
        colorShift ? 'marquee-color-shift' : ''
      }`}
      style={{
        backgroundColor: housingBg,
        boxShadow: `0 0 18px 2px ${colorHex}55, inset 0 0 10px 0 ${colorHex}22`,
      }}
    >
      <div className="pointer-events-none absolute inset-1 flex flex-col justify-between sm:inset-1.5">
        <div className="flex justify-between">
          <Bulb colorHex={colorHex} />
          <Bulb colorHex={colorHex} />
          <Bulb colorHex={colorHex} />
        </div>
        <div className="flex justify-between">
          <Bulb colorHex={colorHex} />
          <Bulb colorHex={colorHex} />
          <Bulb colorHex={colorHex} />
        </div>
      </div>

      <span className="font-headline text-2xl font-medium text-warm-white sm:text-4xl">
        {char.toUpperCase()}
      </span>
    </motion.div>
  )
}

function Bulb({ colorHex }: { colorHex: string }) {
  return (
    <span
      className="h-1 w-1 rounded-full sm:h-1.5 sm:w-1.5"
      style={{
        backgroundColor: colorHex,
        boxShadow: `0 0 4px 1px ${colorHex}`,
      }}
    />
  )
}
