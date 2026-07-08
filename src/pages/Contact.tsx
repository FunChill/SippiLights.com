import { useSEO } from '../lib/seo'
import { SITE } from '../lib/site'

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

export default function Contact() {
  useSEO({
    title: 'Check Availability & Get a Quote | Sippi Lights Jackson MS',
    description:
      'Request a marquee letter, number, or uplighting quote from Sippi Lights. Call (601) 813-2464 or send your event date to check availability.',
  })

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
        </div>

        <form
          onSubmit={(e) => e.preventDefault()}
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
              <input id="eventDate" name="eventDate" type="date" required className={inputClass} />
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

          <button
            type="submit"
            className="mt-2 rounded-button bg-gold px-7 py-3 text-sm font-medium text-charcoal transition-colors duration-200 hover:bg-gold-light"
          >
            Check Availability
          </button>
        </form>
      </div>
    </div>
  )
}
