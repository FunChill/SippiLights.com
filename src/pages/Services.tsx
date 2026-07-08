import { useSEO } from '../lib/seo'
import { Button } from '../components/Button'
import { ImagePlaceholder } from '../components/ImagePlaceholder'

const SERVICES = [
  {
    name: 'Marquee Letters',
    price: '$70 per letter',
    finish: 'Finish: white only',
    copy: 'Freestanding, warm-white marquee letters spell out a name, word, or milestone across your venue. Each letter stands roughly four feet tall and runs on a single standard outlet, so they set up fast and read beautifully in photos day or night.',
  },
  {
    name: 'Marquee Numbers',
    price: '$70 per number',
    finish: 'Finish: black or white',
    copy: "Oversized marquee numbers anchor birthdays, anniversaries, and graduation years. Choose black or white to match your color scheme, and pair with letters for a full custom display.",
  },
  {
    name: 'LED Uplighting',
    price: 'Priced per event',
    finish: 'Bulbs adjustable to any event color scheme',
    copy: 'Wireless LED uplights wash walls, tents, columns, and dance floors in color. Every fixture is remote-controlled and dialed in to your palette on site, so your venue transforms the moment the lights go up.',
  },
  {
    name: 'Stages & Arches',
    price: 'Priced per event',
    finish: 'Built and installed on site',
    copy: 'Illuminated stage risers and ceremony arches give your event a focal point, whether it is a head table, a first dance, or an "I do." Built sturdy, lit warm, and installed before your guests arrive.',
  },
]

export default function Services() {
  useSEO({
    title: 'Marquee Letters, Numbers & LED Uplighting | Sippi Lights',
    description:
      'Marquee letters ($70/ea, white), marquee numbers ($70/ea, black or white), LED uplighting with custom color, and stages & arches. Serving Jackson, MS.',
  })

  return (
    <div className="px-6 py-20 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs tracking-[0.2em] text-gold uppercase">
          Our Services
        </p>
        <h1 className="mt-4 max-w-2xl font-headline text-4xl font-light lg:text-5xl">
          Everything You Need to Light the Room
        </h1>
        <p className="mt-6 max-w-xl text-text-muted">
          Every rental is delivered, set up, and picked up by Sippi Lights —
          no assembly required on your end.
        </p>

        <div className="mt-16 flex flex-col gap-16">
          {SERVICES.map((service, i) => (
            <div
              key={service.name}
              className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
                i % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''
              }`}
            >
              <ImagePlaceholder
                label={`${service.name} photo`}
                className="aspect-[4/3] w-full"
              />
              <div>
                <h2 className="font-headline text-3xl font-light">
                  {service.name}
                </h2>
                <p className="mt-2 text-sm tracking-wide text-gold uppercase">
                  {service.price}
                </p>
                <p className="mt-1 text-sm text-text-muted">
                  {service.finish}
                </p>
                <p className="mt-4 text-text-muted">{service.copy}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <Button to="/contact">Check Availability</Button>
        </div>
      </div>
    </div>
  )
}
