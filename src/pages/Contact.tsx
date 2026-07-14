import { useState } from 'react'
import type { FormEvent } from 'react'
import { useSEO } from '../lib/seo'
import { SITE } from '../lib/site'
import { useBuilder } from '../context/BuilderContext'
import { supabase } from '../lib/supabaseClient'
import { wordToRequestedItems } from '../lib/availability'
import { getCharPrice } from '../data/inventory'
import { AvailabilityStatus } from '../components/AvailabilityStatus'
import { trackInquirySubmitted } from '../lib/analytics'

const EVENT_TYPES = [
  'Birthday',
  'Wedding',
  'Anniversary',
  'Graduation',
  'Baby Shower',
  'Corporate Event',
  'Other',
]

const SERVICE_OPTIONS = [
  'Marquee Letters',
  'Marquee Numbers',
  'LED Uplighting',
  'Stages & Arches',
]

const inputClass =
  'w-full rounded-button border border-gold/20 bg-charcoal-2 px-4 py-3 text-sm text-warm-white placeholder:text-text-muted focus:border-gold focus:outline-none'

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

export default function Contact() {
  useSEO({
    title: 'Check Availability & Get a Quote | Sippi Lights Jackson MS',
    description:
      'Request a marquee letter, number, or uplighting quote from Sippi Lights. Call (601) 813-2464 or send your event date to check availability.',
  })

  const { word, color, numberFinish, eventDate, setEventDate } = useBuilder()
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle')
  const requestedItems = wordToRequestedItems(word, numberFinish)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const selectedServices = data.getAll('services') as string[]

    const items: Array<{
      itemId: string
      character: string | null
      finish: string | null
      qty: number
      price: number | null
    }> = []

    if (word.trim()) {
      for (const req of requestedItems) {
        items.push({
          itemId: `${req.finish}-${req.character}`,
          character: req.character,
          finish: req.finish,
          qty: req.qty,
          price: getCharPrice(req.character),
        })
      }
    }
    for (const service of selectedServices) {
      const coveredByWord =
        word.trim() && (service === 'Marquee Letters' || service === 'Marquee Numbers')
      if (coveredByWord) continue
      items.push({ itemId: service, character: null, finish: null, qty: 1, price: null })
    }

    const subtotal = word.trim()
      ? items.reduce((sum, i) => sum + (i.price ?? 0) * i.qty, 0)
      : null

    setSubmitStatus('submitting')
    try {
      const { error } = await supabase.from('bookings').insert({
        event_date: eventDate,
        customer_name: data.get('name'),
        customer_phone: data.get('phone'),
        customer_email: data.get('email'),
        event_type: data.get('eventType'),
        items,
        word_built: word.trim() || null,
        led_color: word.trim() ? color.label : null,
        subtotal,
        notes: data.get('message') || null,
      })
      if (error) throw error

      // Fire-and-forget: auto-reply + owner notification. The inquiry row is
      // already saved — email hiccups must not fail the submission.
      fetch('/api/notify-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: data.get('name'),
          customerEmail: data.get('email'),
          eventDate,
          eventType: data.get('eventType'),
          services: selectedServices,
          message: data.get('message') || undefined,
        }),
      }).catch(() => {})

      trackInquirySubmitted()
      setSubmitStatus('success')
    } catch {
      setSubmitStatus('error')
    }
  }

  return (
    <div className="px-6 py-20 lg:px-10">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
        <div>
          <p className="text-xs tracking-[0.2em] text-gold uppercase">
            Contact
          </p>
          <h1 className="mt-4 font-headline text-4xl font-light lg:text-5xl">
            Check Your Date's Availability
          </h1>
          <p className="mt-6 text-text-muted">
            Send us your event details and we'll confirm availability and
            pricing. Prefer to talk it through? Call or text anytime.
          </p>

          <div className="mt-8 flex flex-col gap-2 text-sm">
            <a href={SITE.phoneHref} className="text-gold hover:text-gold-light">
              {SITE.phone}
            </a>
            <a
              href={`mailto:${SITE.email}`}
              className="text-warm-white/80 hover:text-gold"
            >
              {SITE.email}
            </a>
            <p className="text-text-muted">{SITE.city}</p>
          </div>

          {word.trim() && (
            <p className="mt-8 text-sm text-text-muted">
              Bringing over your word from the builder:{' '}
              <span className="text-gold">{word}</span>
            </p>
          )}
        </div>

        {submitStatus === 'success' ? (
          <div className="flex flex-col items-start justify-center rounded-card border border-gold/10 bg-charcoal-2 p-6 lg:p-8">
            <p className="font-headline text-2xl text-gold">
              Request received.
            </p>
            <p className="mt-3 text-text-muted">
              We'll confirm within 24 hours. Keep an eye on your email and
              phone — that's how we'll reach you.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-5 rounded-card border border-gold/10 bg-charcoal-2 p-6 lg:p-8"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="mb-2 block text-xs tracking-wide text-text-muted uppercase">
                  Name
                </label>
                <input id="name" name="name" type="text" required className={inputClass} placeholder="Your name" />
              </div>
              <div>
                <label htmlFor="phone" className="mb-2 block text-xs tracking-wide text-text-muted uppercase">
                  Phone
                </label>
                <input id="phone" name="phone" type="tel" required className={inputClass} placeholder="(601) 000-0000" />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-xs tracking-wide text-text-muted uppercase">
                Email
              </label>
              <input id="email" name="email" type="email" required className={inputClass} placeholder="you@email.com" />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="eventDate" className="mb-2 block text-xs tracking-wide text-text-muted uppercase">
                  Event Date
                </label>
                <input
                  id="eventDate"
                  name="eventDate"
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="eventType" className="mb-2 block text-xs tracking-wide text-text-muted uppercase">
                  Event Type
                </label>
                <select id="eventType" name="eventType" required className={inputClass} defaultValue="">
                  <option value="" disabled>
                    Select event type
                  </option>
                  {EVENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {word.trim() && eventDate && (
              <AvailabilityStatus date={eventDate} requestedItems={requestedItems} />
            )}

            <fieldset>
              <legend className="mb-2 block text-xs tracking-wide text-text-muted uppercase">
                Services You're Interested In
              </legend>
              <div className="grid grid-cols-2 gap-3">
                {SERVICE_OPTIONS.map((service) => (
                  <label
                    key={service}
                    className="flex items-center gap-2 text-sm text-warm-white/80"
                  >
                    <input
                      type="checkbox"
                      name="services"
                      value={service}
                      className="h-4 w-4 accent-[#C9A84C]"
                    />
                    {service}
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="message" className="mb-2 block text-xs tracking-wide text-text-muted uppercase">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                className={inputClass}
                placeholder="Tell us about your event..."
              />
            </div>

            {submitStatus === 'error' && (
              <p className="rounded-button border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                Something went wrong sending your request. Please try again,
                or call/text us directly.
              </p>
            )}

            <button
              type="submit"
              disabled={submitStatus === 'submitting'}
              className="mt-2 rounded-button bg-gold px-7 py-3 text-sm font-medium text-charcoal transition-colors duration-200 hover:bg-gold-light disabled:opacity-60"
            >
              {submitStatus === 'submitting'
                ? 'Sending…'
                : submitStatus === 'error'
                  ? 'Try Again'
                  : 'Check Availability'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
