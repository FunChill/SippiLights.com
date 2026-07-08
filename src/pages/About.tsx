import { useSEO } from '../lib/seo'
import { Button } from '../components/Button'
import { ImagePlaceholder } from '../components/ImagePlaceholder'

export default function About() {
  useSEO({
    title: 'About Sippi Lights | Jackson MS Event Lighting',
    description:
      'Owner-operated event lighting rentals serving the Jackson, MS metro for 2+ years. Every Sippi Lights setup is handled personally, start to finish.',
  })

  return (
    <div className="px-6 py-20 lg:px-10">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="text-xs tracking-[0.2em] text-gold uppercase">
            About Sippi Lights
          </p>
          <h1 className="mt-4 font-headline text-4xl font-light lg:text-5xl">
            Elevated Event <span className="text-gold italic">Illumination.</span>
          </h1>
          <p className="mt-6 text-text-muted">
            Sippi Lights has spent the last two-plus years lighting up
            birthdays, weddings, and celebrations across the Jackson metro.
            What started as a small marquee letter collection has grown into
            a full lineup of letters, numbers, LED uplighting, and stages —
            but the way we run it hasn't changed.
          </p>
          <p className="mt-4 text-text-muted">
            Sippi Lights is owner-operated. Every delivery, every setup, and
            every pickup is handled personally, so what you see when you
            book is exactly what shows up on your event day.
          </p>
          <p className="mt-4 text-text-muted">
            We're proud to call Jackson, MS home, and we bring that same
            care to every event we light across the metro.
          </p>
          <div className="mt-8">
            <Button to="/book">Check Availability</Button>
          </div>
        </div>

        <div className="relative">
          <div className="glow-gold" />
          <ImagePlaceholder
            label="Sippi Lights on site"
            className="relative aspect-[4/5] w-full"
          />
        </div>
      </div>
    </div>
  )
}
