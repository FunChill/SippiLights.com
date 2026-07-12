import { useMemo, useState } from 'react'
import { useSEO } from '../lib/seo'
import { useJsonLd, FAQ_PAGE_SCHEMA, LOCAL_BUSINESS_SCHEMA } from '../lib/jsonld'
import { FAQ_CATEGORIES, FAQ_ITEMS } from '../content/faq'
import { FaqAccordion } from '../components/FaqAccordion'
import { Button } from '../components/Button'

export default function Faq() {
  useSEO({
    title: 'Marquee Rental FAQ | Sippi Lights Jackson MS',
    description:
      'Pricing, deposits, delivery zones, power requirements, weather policy, and everything else about renting marquee letters and event lighting in Jackson, MS.',
  })
  useJsonLd([FAQ_PAGE_SCHEMA, LOCAL_BUSINESS_SCHEMA])

  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return FAQ_ITEMS
    return FAQ_ITEMS.filter(
      (item) =>
        item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q),
    )
  }, [query])

  return (
    <div className="px-6 py-20 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs tracking-[0.2em] text-gold uppercase">FAQ</p>
        <h1 className="mt-4 font-headline text-4xl font-light lg:text-5xl">
          Everything You're Wondering
        </h1>
        <p className="mt-6 text-text-muted">
          Straight answers about pricing, delivery, power, and weather — so
          you can book with zero guesswork.
        </p>

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the FAQ…"
          aria-label="Search frequently asked questions"
          className="mt-8 w-full rounded-button border border-gold/20 bg-charcoal-2 px-4 py-3 text-sm text-warm-white placeholder:text-text-muted focus:border-gold focus:outline-none"
        />

        <div className="mt-10 flex flex-col gap-10">
          {query.trim() ? (
            filtered.length > 0 ? (
              <FaqAccordion items={filtered} />
            ) : (
              <p className="text-text-muted">
                No matches — call or text (601) 813-2464 and we'll answer
                directly.
              </p>
            )
          ) : (
            FAQ_CATEGORIES.map((category) => {
              const items = FAQ_ITEMS.filter((i) => i.category === category)
              if (items.length === 0) return null
              return (
                <div key={category}>
                  <h2 className="mb-4 font-headline text-2xl font-light text-gold">
                    {category}
                  </h2>
                  <FaqAccordion items={items} />
                </div>
              )
            })
          )}
        </div>

        <div className="mt-16 text-center">
          <Button to="/book">Check Availability</Button>
        </div>
      </div>
    </div>
  )
}
