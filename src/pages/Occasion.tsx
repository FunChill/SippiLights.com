import { Link, Navigate, useParams } from 'react-router-dom'
import { useSEO } from '../lib/seo'
import { useJsonLd, LOCAL_BUSINESS_SCHEMA, serviceSchema } from '../lib/jsonld'
import { getOccasionBySlug, OCCASIONS } from '../content/occasions'
import { FAQ_ITEMS } from '../content/faq'
import { FaqAccordion } from '../components/FaqAccordion'
import { ImagePlaceholder } from '../components/ImagePlaceholder'
import { DateCheck } from '../components/DateCheck'
import { Button } from '../components/Button'
import { MARQUEE_PRICE } from '../config/pricing'

export default function Occasion() {
  const { slug } = useParams()
  const occasion = slug ? getOccasionBySlug(slug) : undefined

  useSEO({
    title: occasion?.seoTitle ?? 'Marquee Rentals | Sippi Lights',
    description: occasion?.seoDescription ?? '',
  })
  useJsonLd(
    occasion
      ? [
          LOCAL_BUSINESS_SCHEMA,
          serviceSchema(occasion.h1, occasion.seoDescription, MARQUEE_PRICE),
        ]
      : [],
  )

  if (!occasion) return <Navigate to="/" replace />

  const faqSubset = FAQ_ITEMS.filter((item) =>
    occasion.faqQuestions.includes(item.question),
  )
  const related = OCCASIONS.filter((o) => occasion.relatedSlugs.includes(o.slug))

  return (
    <div className="px-6 py-20 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs tracking-[0.2em] text-gold uppercase">
          {occasion.eyebrow} · Jackson, MS
        </p>
        <h1 className="mt-4 font-headline text-4xl font-light lg:text-5xl">
          {occasion.h1}
        </h1>
        <p className="mt-6 text-lg text-text-muted">{occasion.intro}</p>

        <div className="mt-8 flex flex-wrap gap-2">
          {occasion.wordExamples.map((word) => (
            <span
              key={word}
              className="rounded-button border border-gold/25 bg-charcoal-2 px-3 py-1.5 font-headline text-sm tracking-wide text-gold"
            >
              {word}
            </span>
          ))}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <ImagePlaceholder label={`${occasion.eyebrow} setup photo`} className="aspect-[4/3]" />
          <ImagePlaceholder label={`${occasion.eyebrow} display photo`} className="aspect-[4/3]" />
        </div>

        {occasion.sections.map((section) => (
          <div key={section.heading} className="mt-12">
            <h2 className="font-headline text-2xl font-light lg:text-3xl">
              {section.heading}
            </h2>
            {section.body.map((para, i) => (
              <p key={i} className="mt-4 leading-relaxed text-text-muted">
                {para}
              </p>
            ))}
          </div>
        ))}

        <div className="mt-12">
          <h2 className="font-headline text-2xl font-light">Check Your Date</h2>
          <DateCheck label={occasion.eyebrow} />
        </div>

        <div className="mt-12">
          <h2 className="mb-4 font-headline text-2xl font-light">
            Common Questions
          </h2>
          <FaqAccordion items={faqSubset} />
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-4">
          <Button to="/book">Reserve Your Date</Button>
          <Button to="/builder" variant="ghost">
            Preview Your Word
          </Button>
        </div>

        {related.length > 0 && (
          <div className="mt-14 border-t border-gold/10 pt-8">
            <p className="text-xs tracking-[0.15em] text-text-muted uppercase">
              Also lighting up
            </p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  to={`/rentals/${r.slug}`}
                  className="text-sm text-gold hover:text-gold-light"
                >
                  {r.h1} →
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
