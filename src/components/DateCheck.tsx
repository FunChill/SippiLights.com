import { useState } from 'react'
import type { FormEvent } from 'react'
import { checkDateBlocked } from '../lib/availability'

interface DateCheckProps {
  label: string
}

type Status = 'idle' | 'loading' | 'open' | 'blocked' | 'error'

export function DateCheck({ label }: DateCheckProps) {
  const [date, setDate] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [reason, setReason] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!date) return
    setStatus('loading')
    try {
      const result = await checkDateBlocked(date)
      setReason(result.reason)
      setStatus(result.blocked ? 'blocked' : 'open')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="mt-4 rounded-button border border-gold/10 bg-charcoal p-4">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs tracking-[0.1em] text-text-muted uppercase">
            Check a Date for {label}
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-button border border-gold/20 bg-charcoal-2 px-3 py-2 text-sm text-warm-white focus:border-gold focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-button border border-gold/40 px-4 py-2 text-sm text-gold transition-colors duration-150 hover:bg-gold hover:text-charcoal"
        >
          Check
        </button>
      </form>

      {status === 'loading' && (
        <p className="mt-3 text-sm text-text-muted">Checking…</p>
      )}
      {status === 'open' && (
        <p className="mt-3 text-sm text-emerald-300">
          This date is open — use the Word Builder to check specific letters or numbers.
        </p>
      )}
      {status === 'blocked' && (
        <p className="mt-3 text-sm text-amber-300">
          This date is unavailable{reason ? `: ${reason}` : '.'}
        </p>
      )}
      {status === 'error' && (
        <p className="mt-3 text-sm text-red-300">
          Couldn't check that date right now — call or text us instead.
        </p>
      )}
    </div>
  )
}
