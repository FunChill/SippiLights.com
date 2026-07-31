import { useEffect, useState } from 'react'
import { useCheckout } from '../../context/CheckoutContext'
import { getBlockedDatesInRange } from '../../lib/availability'
import { StepNav } from './StepNav'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function startOfToday(): Date {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}

export function StepDate() {
  const { eventDate, setEventDate, setStep } = useCheckout()
  const [viewDate, setViewDate] = useState(() => {
    const initial = eventDate ? new Date(`${eventDate}T00:00:00`) : new Date()
    return new Date(initial.getFullYear(), initial.getMonth(), 1)
  })
  const [blocked, setBlocked] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const rangeStart = toISODate(new Date(year, month, 1))
    const rangeEnd = toISODate(new Date(year, month + 1, 0))

    let cancelled = false
    setLoading(true)

    // Only owner-blocked dates are fetched. Existing bookings are deliberately
    // NOT surfaced — the calendar must never reveal how busy (or not) the
    // schedule is. Per-item availability is checked at the next step.
    getBlockedDatesInRange(rangeStart, rangeEnd)
      .then((blockedSet) => {
        if (cancelled) return
        setBlocked(blockedSet)
      })
      .catch(() => {
        if (cancelled) return
        setBlocked(new Set())
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [viewDate])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDayOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leadingBlanks = firstDayOfMonth.getDay()
  const today = startOfToday()

  const cells: Array<{ date: Date; iso: string } | null> = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(year, month, i + 1)
      return { date, iso: toISODate(date) }
    }),
  ]

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="rounded-button border border-gold/20 px-3 py-1.5 text-sm text-warm-white/80 hover:border-gold/50"
        >
          ←
        </button>
        <p className="font-headline text-xl">
          {MONTH_NAMES[month]} {year}
        </p>
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="rounded-button border border-gold/20 px-3 py-1.5 text-sm text-warm-white/80 hover:border-gold/50"
        >
          →
        </button>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-1 text-center text-xs text-text-muted">
        {WEEKDAYS.map((d, i) => (
          <div key={`${d}-${i}`} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell) return <div key={`blank-${i}`} />

          const isPast = cell.date < today
          const isBlocked = blocked.has(cell.iso)
          const isSelected = eventDate === cell.iso
          const disabled = isPast || isBlocked

          return (
            <button
              key={cell.iso}
              type="button"
              disabled={disabled}
              onClick={() => setEventDate(cell.iso)}
              className={`relative aspect-square rounded-lg text-sm transition-colors duration-150 ${
                isSelected
                  ? 'bg-gold text-charcoal'
                  : disabled
                    ? 'cursor-not-allowed text-text-muted/40 line-through'
                    : 'text-warm-white hover:bg-charcoal-2'
              }`}
            >
              {cell.date.getDate()}
            </button>
          )
        })}
      </div>

      {loading && (
        <p className="mt-4 text-xs text-text-muted">Loading availability…</p>
      )}
      <p className="mt-4 text-xs text-text-muted">
        Struck-through dates are unavailable. Pick your date and we'll check
        your specific letters and numbers next.
      </p>

      <StepNav hideBack nextDisabled={!eventDate} onNext={() => setStep(2)} />
    </div>
  )
}
