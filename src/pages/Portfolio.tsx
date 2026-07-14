import { useSEO } from '../lib/seo'
import { Testimonials } from '../components/Testimonials'

const GALLERY = [
  'Birthday Celebration',
  'Wedding Reception',
  'Anniversary Party',
  'Graduation Party',
  'Corporate Event',
  'Baby Shower',
  'Sweet 16',
  'Holiday Party',
]

export default function Portfolio() {
  useSEO({
    title: 'Event Lighting Portfolio | Sippi Lights Jackson MS',
    description:
      'See Sippi Lights marquee letters, numbers, and LED uplighting in action at weddings, birthdays, and celebrations across Jackson, MS.',
  })

  return (
    <div className="px-6 py-20 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs tracking-[0.2em] text-gold uppercase">
          Portfolio
        </p>
        <h1 className="mt-4 max-w-2xl font-headline text-4xl font-light lg:text-5xl">
          Moments We've Helped Light Up
        </h1>
        <p className="mt-6 max-w-xl text-text-muted">
          A look at Sippi Lights marquee letters, numbers, and uplighting
          from real celebrations around Jackson.
        </p>

        <div className="mt-14 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {GALLERY.map((occasion) => (
            <div
              key={occasion}
              className="group relative aspect-square overflow-hidden rounded-card border border-gold/10 bg-charcoal-2"
            >
              <div className="flex h-full items-center justify-center">
                <span className="px-4 text-center text-xs tracking-[0.15em] text-text-muted uppercase">
                  Photo coming soon
                </span>
              </div>
              <div className="absolute inset-0 flex items-end bg-charcoal/0 p-4 opacity-0 transition-all duration-200 group-hover:bg-charcoal/70 group-hover:opacity-100">
                <span className="font-headline text-lg text-gold">
                  {occasion}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer reviews — real, moderated; never placeholder content */}
      <Testimonials limit={9} />
    </div>
  )
}
