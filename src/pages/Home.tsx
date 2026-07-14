import { motion } from 'motion/react'
import { useSEO } from '../lib/seo'
import { SITE } from '../lib/site'
import { Button } from '../components/Button'
import { WordBuilder } from '../components/WordBuilder'
import { SplineHero } from '../components/SplineHero'
import { FaqAccordion } from '../components/FaqAccordion'
import { Testimonials } from '../components/Testimonials'
import { FAQ_ITEMS } from '../content/faq'
import { Link } from 'react-router-dom'
import { useJsonLd, LOCAL_BUSINESS_SCHEMA } from '../lib/jsonld'

const SERVICES = [
  {
    name: 'Marquee Letters',
    meta: 'White · $70/ea',
    copy: 'Freestanding warm-white marquee letters spell out any name, word, or milestone. White finish only.',
  },
  {
    name: 'Marquee Numbers',
    meta: 'Black or White · $70/ea',
    copy: 'Oversized marquee numbers mark the big day — ages, anniversaries, class years. Black or white finish.',
  },
  {
    name: 'LED Uplighting',
    meta: 'Custom color',
    copy: 'Wireless LED fixtures wash walls, tents, and stages in color, adjustable to match any event palette.',
  },
  {
    name: 'Stages & Arches',
    meta: 'Built to anchor the moment',
    copy: "Illuminated stage risers and ceremony arches built to anchor your event's focal point.",
  },
]

const STEPS = [
  {
    title: 'You Reserve',
    copy: 'Pick your date and pieces, lock it in with a deposit.',
  },
  {
    title: 'We Deliver & Set Up',
    copy: 'We arrive ahead of your event and handle the entire setup.',
  },
  {
    title: 'We Pick Up',
    copy: 'After the celebration, we return and break everything down.',
  },
]

const STATS = [
  { value: '$70', label: 'Per Marquee' },
  { value: '25 mi', label: 'Free Delivery' },
  { value: '50 mi', label: 'Service Radius' },
]

export default function Home() {
  useSEO({
    title: 'Marquee Letter Rentals Jackson MS | Sippi Lights',
    description:
      'Marquee letters, numbers, LED uplighting and stages for birthdays, weddings, and every celebration in Jackson, MS. Free delivery within 25 miles.',
  })
  useJsonLd([LOCAL_BUSINESS_SCHEMA])

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-16 pb-10 lg:px-10 lg:pt-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <p className="text-xs tracking-[0.2em] text-gold uppercase">
              Jackson, MS · Free Delivery Within 25 Miles
            </p>
            <h1 className="mt-4 font-headline text-5xl leading-[1.05] font-light lg:text-6xl xl:text-[64px]">
              Light Up Your Most{' '}
              <span className="font-medium text-gold italic">Memorable</span>{' '}
              Moment
            </h1>
            <p className="mt-6 max-w-lg text-base text-text-muted lg:text-lg">
              Marquee letters, numbers, LED uplighting and stages for
              birthdays, weddings, and every celebration worth remembering.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button to="/book">Check Availability</Button>
              <Button to="/portfolio" variant="ghost">
                View Our Work
              </Button>
            </div>

            <div className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-gold/15 pt-6">
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <p className="font-headline text-2xl text-gold">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[11px] tracking-[0.1em] text-text-muted uppercase">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className="relative"
          >
            <div className="glow-gold" />
            <SplineHero className="aspect-[4/5] w-full" />
          </motion.div>
        </div>
      </section>

      {/* Word Builder teaser */}
      <section className="px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs tracking-[0.2em] text-gold uppercase">
            Try It Now
          </p>
          <h2 className="mt-4 font-headline text-3xl font-light lg:text-4xl">
            Build Your Word
          </h2>
          <p className="mt-4 max-w-xl text-text-muted">
            Type a name or number below and watch it light up as a marquee —
            with your price, live.
          </p>

          <div className="mt-10 rounded-card border border-gold/10 bg-charcoal-2 p-6 lg:p-10">
            <WordBuilder compact />
          </div>
        </div>
      </section>

      {/* Services preview */}
      <section className="px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-headline text-3xl font-light lg:text-4xl">
            What We Light Up
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((service) => (
              <div
                key={service.name}
                className="group rounded-card border border-gold/10 bg-charcoal p-6 transition-all duration-200 hover:border-gold/40 hover:bg-charcoal-2"
              >
                <h3 className="font-headline text-xl">{service.name}</h3>
                <p className="mt-1 text-xs tracking-wide text-gold uppercase">
                  {service.meta}
                </p>
                <p className="mt-3 text-sm text-text-muted">{service.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works strip */}
      <section className="border-y border-gold/10 bg-charcoal-2 px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-headline text-3xl font-light lg:text-4xl">
            How It Works
          </h2>
          <div className="mt-10 grid gap-10 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title}>
                <p className="font-headline text-3xl text-gold">
                  {String(i + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-3 text-lg font-medium">{step.title}</h3>
                <p className="mt-2 text-sm text-text-muted">{step.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service area */}
      <section className="px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-headline text-3xl font-light lg:text-4xl">
            Service Area
          </h2>
          <p className="mt-4 text-text-muted">
            Free delivery within 25 miles of Jackson, MS. Deliveries between
            26–50 miles require a 4+ marquee minimum.
          </p>
          <p className="mt-4 text-text-muted">
            Proudly serving {SITE.serviceCities.join(', ')}, and surrounding
            communities.
          </p>
        </div>
      </section>

      {/* Customer reviews — real, moderated; never placeholder content */}
      <Testimonials limit={6} />

      {/* FAQ preview */}
      <section className="border-t border-gold/10 px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-headline text-3xl font-light lg:text-4xl">
            Quick Answers
          </h2>
          <div className="mt-8">
            <FaqAccordion items={FAQ_ITEMS.slice(0, 5)} />
          </div>
          <p className="mt-6 text-sm text-text-muted">
            More questions?{' '}
            <Link to="/faq" className="text-gold hover:text-gold-light">
              See the full FAQ →
            </Link>
          </p>
        </div>
      </section>

      {/* CTA banner */}
      <section className="relative overflow-hidden border-t border-gold/15 px-6 py-16 text-center lg:px-10">
        <div className="glow-purple" />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="font-headline text-3xl font-light lg:text-4xl">
            Your date is filling up.{' '}
            <span className="text-gold italic">Lock it in.</span>
          </h2>
          <div className="mt-8 flex justify-center">
            <Button to="/book">Check Availability</Button>
          </div>
        </div>
      </section>
    </>
  )
}
