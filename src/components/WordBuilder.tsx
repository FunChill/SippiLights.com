import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { useBuilder } from '../context/BuilderContext'
import { MARQUEE_COLORS } from '../lib/marqueeColors'
import { getCharPrice } from '../data/inventory'
import { wordToRequestedItems } from '../lib/availability'
import { MarqueeChar } from './MarqueeChar'
import { AvailabilityStatus } from './AvailabilityStatus'
import { Button } from './Button'
import { trackBuilderUsed } from '../lib/analytics'

interface WordBuilderProps {
  compact?: boolean
  showDateField?: boolean
  showCTA?: boolean
}

export function WordBuilder({
  compact = false,
  showDateField = true,
  showCTA = true,
}: WordBuilderProps) {
  const {
    word,
    setWord,
    color,
    setColorId,
    numberFinish,
    setNumberFinish,
    eventDate,
    setEventDate,
    maxLength,
  } = useBuilder()
  const [hadInvalidChar, setHadInvalidChar] = useState(false)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const cleaned = raw.replace(/[^A-Za-z0-9 ]/g, '')
    setHadInvalidChar(cleaned.length !== raw.length)
    setWord(cleaned)
    if (cleaned.trim()) trackBuilderUsed()
  }

  const chars = word.split('')
  const pricedChars = chars.filter((c) => c !== ' ')
  const prices = pricedChars.map((c) => getCharPrice(c) ?? 0)
  const total = prices.reduce((sum, p) => sum + p, 0)
  const unitPrice = prices[0] ?? 0
  const allSamePrice = prices.every((p) => p === unitPrice)

  const priceLine =
    pricedChars.length === 0
      ? 'Start typing to see your price'
      : allSamePrice
        ? `${pricedChars.length} marquee${pricedChars.length === 1 ? '' : 's'} × $${unitPrice} = $${total}`
        : `${pricedChars.length} marquees = $${total}`

  return (
    <div>
      <input
        type="text"
        value={word}
        onChange={handleChange}
        maxLength={maxLength}
        placeholder="Type your word or number"
        aria-label="Word or number to light up"
        className="w-full rounded-button border border-gold/20 bg-charcoal-2 px-5 py-4 text-lg text-warm-white placeholder:text-text-muted focus:border-gold focus:outline-none sm:text-xl"
      />
      {hadInvalidChar && (
        <p className="mt-2 text-xs text-text-muted">
          Only letters and numbers light up — symbols are skipped.
        </p>
      )}

      <div className="mt-6 flex min-h-16 flex-wrap gap-2 sm:min-h-20 sm:gap-3">
        {chars.length === 0 && (
          <p className="text-sm text-text-muted">
            Your marquee will glow here as you type.
          </p>
        )}
        {chars.map((char, i) => (
          <MarqueeChar
            key={`${i}-${char}`}
            char={char}
            index={i}
            colorHex={color.hex}
            colorShift={color.shift}
            isNumber={/[0-9]/.test(char)}
            finish={/[0-9]/.test(char) ? numberFinish : 'white'}
          />
        ))}
      </div>

      <p className="mt-6 font-headline text-xl text-gold sm:text-2xl">{priceLine}</p>

      {showDateField && (
        <div className="mt-6 max-w-xs">
          <label htmlFor="builder-event-date" className="mb-2 block text-xs tracking-[0.15em] text-text-muted uppercase">
            Check a Date
          </label>
          <input
            id="builder-event-date"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="w-full rounded-button border border-gold/20 bg-charcoal-2 px-4 py-3 text-sm text-warm-white focus:border-gold focus:outline-none"
          />
          <AvailabilityStatus
            date={eventDate}
            requestedItems={wordToRequestedItems(word, numberFinish)}
          />
        </div>
      )}

      <div className="mt-6">
        <p className="mb-2 text-xs tracking-[0.15em] text-text-muted uppercase">
          Bulb Color
        </p>
        <div className="flex flex-wrap gap-2">
          {MARQUEE_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setColorId(c.id)}
              aria-label={c.label}
              aria-pressed={color.id === c.id}
              title={c.label}
              className={`h-8 w-8 rounded-full border-2 transition-transform duration-150 ${
                color.id === c.id
                  ? 'scale-110 border-warm-white'
                  : 'border-transparent hover:scale-105'
              } ${c.shift ? 'marquee-color-shift' : ''}`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-xs tracking-[0.15em] text-text-muted uppercase">
          Number Finish
        </p>
        <div className="flex items-center gap-3">
          {(['white', 'black'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setNumberFinish(f)}
              aria-pressed={numberFinish === f}
              className={`rounded-button border px-4 py-2 text-sm capitalize transition-colors duration-150 ${
                numberFinish === f
                  ? 'border-gold bg-gold text-charcoal'
                  : 'border-gold/20 text-warm-white/80 hover:border-gold/50'
              }`}
            >
              {f}
            </button>
          ))}
          <p className="text-xs text-text-muted">Letters are white only.</p>
        </div>
      </div>

      {showCTA && (
        <div className="mt-8 flex flex-wrap gap-4">
          <Button to="/book">Check This Date</Button>
          {compact && (
            <Button to="/builder" variant="ghost">
              Open Full Builder
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
