import { useEffect, useMemo, useState } from 'react'
import { fetchReviews, lastMonthKeys, type Review } from '../../lib/phase7'

/**
 * Dashboard feedback widget: average rating trend (6 months), recent feed,
 * and low ratings (below 4) flagged for owner follow-up.
 */
export function ReviewsWidget() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetchReviews()
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoaded(true))
  }, [])

  const avg = useMemo(
    () => (reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0),
    [reviews],
  )

  const monthlyAvg = useMemo(
    () =>
      lastMonthKeys(6).map((m) => {
        const rows = reviews.filter((r) => r.submitted_at.startsWith(m))
        return {
          label: m.slice(5),
          value: rows.length ? rows.reduce((s, r) => s + r.rating, 0) / rows.length : null,
        }
      }),
    [reviews],
  )

  const flagged = useMemo(() => reviews.filter((r) => r.rating < 4).slice(0, 5), [reviews])
  const recent = useMemo(() => reviews.slice(0, 4), [reviews])

  if (!loaded) return null

  return (
    <div className="rounded-card border border-gold/10 bg-charcoal-2 p-4">
      <h2 className="text-xs tracking-[0.15em] text-text-muted uppercase">Customer feedback</h2>

      {reviews.length === 0 ? (
        <p className="mt-3 text-sm text-text-muted">
          No feedback yet — the ask goes out automatically the day after each event.
        </p>
      ) : (
        <>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-headline text-3xl text-gold">{avg.toFixed(1)}</span>
            <Stars value={Math.round(avg)} />
            <span className="text-xs text-text-muted">({reviews.length})</span>
          </div>

          <div className="mt-2 flex items-end gap-1" aria-label="Average rating by month">
            {monthlyAvg.map((m) => (
              <div key={m.label} className="flex flex-1 flex-col items-center gap-0.5">
                <div
                  className="w-full rounded-t bg-gold/70"
                  style={{ height: `${m.value != null ? (m.value / 5) * 36 : 2}px` }}
                  title={m.value != null ? `${m.label}: ${m.value.toFixed(1)}★` : `${m.label}: no reviews`}
                />
                <span className="text-[9px] text-text-muted">{m.label}</span>
              </div>
            ))}
          </div>

          {flagged.length > 0 && (
            <div className="mt-4 rounded-button border border-amber-500/30 bg-amber-500/5 p-3">
              <p className="text-[10px] tracking-wide text-amber-300 uppercase">Follow up needed</p>
              {flagged.map((r) => (
                <p key={r.id} className="mt-1.5 text-xs text-amber-200/90">
                  {r.rating}★ · {r.feedback_text.slice(0, 90)}
                  {r.feedback_text.length > 90 ? '…' : ''}
                </p>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-col gap-2">
            {recent.map((r) => (
              <div key={r.id} className="rounded-button border border-gold/10 p-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <Stars value={r.rating} />
                  <span className="text-text-muted">
                    {r.submitted_at.slice(0, 10)}
                    {r.permission_to_share ? ' · shareable' : ''}
                  </span>
                </div>
                <p className="mt-1 text-warm-white/85">
                  {r.feedback_text.slice(0, 140)}
                  {r.feedback_text.length > 140 ? '…' : ''}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Stars({ value }: { value: number }) {
  return (
    <span className="text-sm" aria-label={`${value} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= value ? 'text-gold' : 'text-gold/20'}>
          ★
        </span>
      ))}
    </span>
  )
}
