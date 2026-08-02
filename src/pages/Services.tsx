import { useSEO } from '../lib/seo'
import { Button } from '../components/Button'
import { ImagePlaceholder } from '../components/ImagePlaceholder'
import { DateCheck } from '../components/DateCheck'
import { getItemsByCategory, formatPrice } from '../data/inventory'

const letterItems = getItemsByCategory('letter')
const numberItems = getItemsByCategory('number')
const uniqueDigits = [...new Set(numberItems.map((item) => item.name))]
const [ledUplighting] = getItemsByCategory('uplighting')
const [stage, arch3d] = getItemsByCategory('stage')

const FEATURE_ITEMS = [
  {
    item: ledUplighting,
    finishNote: 'LED lighting adjustable to any event color scheme',
    copy: 'Wireless LED uplights wash walls, tents, columns, and dance floors in color. Every fixture is remote-controlled and dialed in to your palette on site, so your venue transforms the moment the lights go up.',
  },
  {
    item: stage,
    finishNote: 'Built and installed on site',
    copy: 'A raised, illuminated stage anchors your head table, first dance, or performance with a clear focal point — built sturdy, lit warm, and set up before your guests arrive.',
  },
  {
    item: arch3d,
    finishNote: 'Built and installed on site',
    copy: 'Our 3D arch frames the moment that matters — a ceremony backdrop, entrance, or photo centerpiece, illuminated and installed exactly where you want it.',
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

        {/* Marquee Letters */}
        <div className="mt-16">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-headline text-3xl font-light">
              Marquee Letters
            </h2>
            <p className="text-sm tracking-wide text-gold uppercase">
              {formatPrice(letterItems[0].price)} per letter · White finish
              only
            </p>
          </div>
          <p className="mt-3 max-w-2xl text-text-muted">
            Freestanding, warm-white marquee letters spell out a name, word,
            or milestone across your venue. Every letter runs on a single
            standard outlet, so setup is fast and it reads beautifully in
            photos day or night.
          </p>
          <div className="mt-6 grid grid-cols-6 gap-2 sm:grid-cols-9 lg:grid-cols-[repeat(13,minmax(0,1fr))]">
            {letterItems.map((item) => (
              <div
                key={item.id}
                className="flex aspect-square items-center justify-center rounded-lg border border-gold/10 bg-charcoal-2 font-headline text-xl text-warm-white"
              >
                {item.name}
              </div>
            ))}
          </div>
          <DateCheck label="Marquee Letters" />
        </div>

        {/* Marquee Numbers */}
        <div className="mt-16">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-headline text-3xl font-light">
              Marquee Numbers
            </h2>
            <p className="text-sm tracking-wide text-gold uppercase">
              {formatPrice(numberItems[0].price)} per number · Black or White
            </p>
          </div>
          <p className="mt-3 max-w-2xl text-text-muted">
            Oversized marquee numbers anchor birthdays, anniversaries, and
            graduation years. Choose black or white to match your color
            scheme, and pair with letters for a full custom display.
          </p>
          <div className="mt-6 grid grid-cols-5 gap-2 sm:grid-cols-10">
            {uniqueDigits.map((digit) => (
              <div
                key={digit}
                className="flex aspect-square items-center justify-center rounded-lg border border-gold/10 bg-charcoal-2 font-headline text-xl text-warm-white"
              >
                {digit}
              </div>
            ))}
          </div>
          <DateCheck label="Marquee Numbers" />
        </div>

        {/* LED Uplighting + Stage + 3D Arch */}
        <div className="mt-20 flex flex-col gap-16">
          {FEATURE_ITEMS.map(({ item, finishNote, copy }, i) => (
            <div
              key={item.id}
              className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
                i % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''
              }`}
            >
              <ImagePlaceholder
                label={`${item.name} photo`}
                className="aspect-[4/3] w-full"
              />
              <div>
                <h2 className="font-headline text-3xl font-light">
                  {item.name}
                </h2>
                <p className="mt-2 text-sm tracking-wide text-gold uppercase">
                  {formatPrice(item.price)}
                </p>
                <p className="mt-1 text-sm text-text-muted">{finishNote}</p>
                <p className="mt-4 text-text-muted">{copy}</p>
                <DateCheck label={item.name} />
              </div>
            </div>
          ))}
        </div>

        {/* Build Your Word banner */}
        <div className="relative mt-20 overflow-hidden rounded-card border border-gold/15 px-6 py-12 text-center">
          <div className="glow-gold" />
          <div className="relative">
            <h2 className="font-headline text-3xl font-light lg:text-4xl">
              See Your Word{' '}
              <span className="text-gold italic">Light Up</span>
            </h2>
            <p className="mx-auto mt-3 max-w-md text-text-muted">
              Type your word or number and preview it as a glowing marquee —
              with your price, instantly.
            </p>
            <div className="mt-6 flex justify-center">
              <Button to="/builder">Build Your Word</Button>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <Button to="/book" variant="ghost">
            Check Availability
          </Button>
        </div>
      </div>
    </div>
  )
}
