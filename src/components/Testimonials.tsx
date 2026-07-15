import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { fetchPublicReviews, reviewsJsonLd, type PublicReview } from '../lib/publicReviews'
import { useJsonLd } from '../lib/jsonld'

/**
 * Real customer reviews only — sourced from the moderated public_reviews
 * view (owner-approved + customer-permitted). Never placeholder content:
 * with zero approved reviews the section shows a quiet coming-soon state.
 */
export function Testimonials({ limit = 6 }: { limit?: number }) {
  const [reviews, setReviews] = useState<PublicReview[] | null>(null)

  useEffect(() => {
    fetchPublicReviews(limit)
      .then(setReviews)
      .catch(() => setReviews([]))
  }, [limit])

  useJsonLd(reviews?.length ? reviewsJsonLd(reviews) : [])

  if (reviews === null) return null // loading — render nothing, no layout jump worth a spinner

  return (
    <section className="px-6 py-20 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-center text-xs tracking-[0.2em] text-gold uppercase">
          From Our Customers
        </p>
        <h2 className="mt-3 text-center font-headline text-4xl font-light">
          Moments We've Lit Up
        </h2>

        {reviews.length === 0 ? (
          <p className="mx-auto mt-8 max-w-md text-center text-sm text-text-muted">
            Reviews from real Sippi Lights celebrations are on their way — every one comes straight
            from a customer after their event.
          </p>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r, i) => (
              <motion.figure
                key={`${r.first_name_display}-${r.event_month}-${i}`}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
                className="flex flex-col rounded-card border border-gold/10 bg-charcoal-2 p-6"
              >
                <div aria-label={`${r.rating} of 5 stars`} className="text-gold">
                  {'★'.repeat(r.rating)}
                  <span className="text-gold/20">{'★'.repeat(5 - r.rating)}</span>
                </div>
                <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-warm-white/85">
                  "{r.feedback_text}"
                </blockquote>
                <figcaption className="mt-4 text-xs text-text-muted">
                  <span className="text-warm-white">{r.first_name_display}</span>
                  {r.occasion ? ` · ${r.occasion}` : ''} · {r.event_month}
                </figcaption>
              </motion.figure>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
