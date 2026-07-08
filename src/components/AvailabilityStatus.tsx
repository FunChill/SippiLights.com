import { useEffect, useState } from 'react'
import { checkAvailability, describeConflicts } from '../lib/availability'
import type { RequestedItem, AvailabilityResult } from '../lib/availability'

interface AvailabilityStatusProps {
  date: string
  requestedItems: RequestedItem[]
}

type Status = 'idle' | 'loading' | 'ready' | 'error'

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  })
}

export function AvailabilityStatus({ date, requestedItems }: AvailabilityStatusProps) {
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<AvailabilityResult | null>(null)
  const requestedKey = JSON.stringify(requestedItems)

  useEffect(() => {
    if (!date || requestedItems.length === 0) {
      setStatus('idle')
      setResult(null)
      return
    }

    let cancelled = false
    setStatus('loading')

    checkAvailability(date, requestedItems)
      .then((r) => {
        if (cancelled) return
        setResult(r)
        setStatus('ready')
      })
      .catch(() => {
        if (cancelled) return
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, requestedKey])

  if (status === 'idle') return null

  if (status === 'loading') {
    return <p className="mt-4 text-sm text-text-muted">Checking availability…</p>
  }

  if (status === 'error') {
    return (
      <p className="mt-4 rounded-button border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        We couldn't check availability right now — you can still submit your request below.
      </p>
    )
  }

  if (!result) return null

  if (result.allAvailable) {
    return (
      <p className="mt-4 rounded-button border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
        Available for {formatDate(date)}.
      </p>
    )
  }

  return (
    <p className="mt-4 rounded-button border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
      {describeConflicts(result)}
    </p>
  )
}
