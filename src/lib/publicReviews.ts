import { supabase } from './supabaseClient'

/**
 * Approved customer reviews from the public_reviews view — the ONLY review
 * surface the public can read. Five fields, owner-approved + customer-
 * permitted rows only, newest first (ordering baked into the view).
 */
export interface PublicReview {
  rating: number
  feedback_text: string
  first_name_display: string
  occasion: string | null
  event_month: string
}

export async function fetchPublicReviews(limit = 12): Promise<PublicReview[]> {
  const { data, error } = await supabase.from('public_reviews').select('*').limit(limit)
  if (error) throw error
  return (data ?? []) as PublicReview[]
}

/** Review + AggregateRating JSON-LD for pages that display reviews. */
export function reviewsJsonLd(reviews: PublicReview[]): object[] {
  if (reviews.length === 0) return []
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'Sippi Lights',
      url: 'https://sippilights.com',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Math.round(avg * 10) / 10,
        reviewCount: reviews.length,
        bestRating: 5,
        worstRating: 1,
      },
      review: reviews.map((r) => ({
        '@type': 'Review',
        reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
        author: { '@type': 'Person', name: r.first_name_display },
        reviewBody: r.feedback_text,
      })),
    },
  ]
}
