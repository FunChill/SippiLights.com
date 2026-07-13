import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSEO } from '../lib/seo'

type PageState = 'loading' | 'invalid' | 'already' | 'form' | 'sending' | 'done'

interface TokenInfo {
  valid: boolean
  alreadySubmitted: boolean
  firstName: string
  wordBuilt: string | null
  eventDate: string
}

/**
 * Post-event feedback capture, reached only from the thank-you email's
 * signed-token link. One submission per booking — the API invalidates the
 * token after a successful submit.
 */
export default function Feedback() {
  useSEO({ title: 'How did we do? | Sippi Lights', description: 'Tell us about your Sippi Lights experience.' })

  const { token } = useParams<{ token: string }>()
  const [state, setState] = useState<PageState>('loading')
  const [info, setInfo] = useState<TokenInfo | null>(null)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [text, setText] = useState('')
  const [share, setShare] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setState('invalid')
      return
    }
    fetch(`/api/submit-feedback?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data: TokenInfo) => {
        if (!data.valid) return setState('invalid')
        setInfo(data)
        setState(data.alreadySubmitted ? 'already' : 'form')
      })
      .catch(() => setState('invalid'))
  }, [token])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (rating === 0) {
      setError('Tap a star to rate your experience.')
      return
    }
    setState('sending')
    try {
      const res = await fetch('/api/submit-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, rating, feedbackText: text, permissionToShare: share }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409) return setState('already')
        setError(data.error ?? 'Something went wrong. Please try again.')
        setState('form')
        return
      }
      setState('done')
    } catch {
      setError('Something went wrong. Please try again.')
      setState('form')
    }
  }

  if (state === 'loading') {
    return <div className="px-6 py-24 text-center text-text-muted">Loading…</div>
  }

  if (state === 'invalid') {
    return (
      <Shell>
        <h1 className="font-headline text-3xl font-light">This link isn't active</h1>
        <p className="mt-4 text-text-muted">
          This feedback link is no longer valid. If you meant to tell us about your event, call or
          text <span className="text-gold">(601) 813-2464</span> — we'd love to hear from you.
        </p>
      </Shell>
    )
  }

  if (state === 'already') {
    return (
      <Shell>
        <h1 className="font-headline text-3xl font-light">Already got it — thank you!</h1>
        <p className="mt-4 text-text-muted">
          Your feedback for this event was already submitted. We appreciate you taking the time.
        </p>
      </Shell>
    )
  }

  if (state === 'done') {
    return (
      <Shell>
        <h1 className="font-headline text-3xl font-light">
          Thank you{info?.firstName ? `, ${info.firstName}` : ''}! ✨
        </h1>
        <p className="mt-4 text-text-muted">
          Your feedback means a lot to a local business like ours. Next celebration on the
          calendar? <a href="/book" className="text-gold hover:underline">Your date is one click away</a>.
        </p>
      </Shell>
    )
  }

  return (
    <Shell>
      <p className="text-xs tracking-[0.2em] text-gold uppercase">How did we do?</p>
      <h1 className="mt-2 font-headline text-3xl font-light">
        {info?.firstName ? `${info.firstName}, tell` : 'Tell'} us about your{' '}
        {info?.wordBuilt ? `"${info.wordBuilt}"` : 'Sippi Lights'} experience
      </h1>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-6">
        <div>
          <p className="mb-2 text-xs tracking-[0.15em] text-text-muted uppercase">Your rating</p>
          <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                aria-label={`${star} star${star > 1 ? 's' : ''}`}
                className="text-3xl transition-transform hover:scale-110"
              >
                <span className={(hoverRating || rating) >= star ? 'text-gold' : 'text-gold/20'}>
                  ★
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="feedback-text" className="mb-2 block text-xs tracking-[0.15em] text-text-muted uppercase">
            Your feedback
          </label>
          <textarea
            id="feedback-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            rows={5}
            placeholder="How was the setup, the look, the whole experience?"
            className="w-full rounded-button border border-gold/20 bg-charcoal px-4 py-3 text-sm text-warm-white focus:border-gold focus:outline-none"
          />
        </div>

        <label className="flex cursor-pointer items-start gap-3 text-sm text-text-muted">
          <input
            type="checkbox"
            checked={share}
            onChange={(e) => setShare(e.target.checked)}
            className="mt-0.5 accent-[#c9a84c]"
          />
          <span>You may share my review on your website</span>
        </label>

        {error && <p className="text-sm text-red-300">{error}</p>}

        <button
          type="submit"
          disabled={state === 'sending'}
          className="self-start rounded-button bg-gold px-8 py-3 text-sm font-medium text-charcoal hover:bg-gold-light disabled:opacity-50"
        >
          {state === 'sending' ? 'Sending…' : 'Send Feedback'}
        </button>
      </form>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-6 py-20">
      <div className="mx-auto max-w-xl rounded-card border border-gold/10 bg-charcoal-2 p-8 md:p-10">
        {children}
      </div>
    </div>
  )
}
