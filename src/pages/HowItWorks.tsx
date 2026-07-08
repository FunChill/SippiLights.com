import { useSEO } from '../lib/seo'
import { Button } from '../components/Button'

const STEPS = [
  {
    title: 'You Reserve',
    copy: 'Tell us your date, venue, and which pieces you want — letters, numbers, uplighting, or a stage. We confirm availability and lock in your reservation with a deposit.',
  },
  {
    title: 'We Deliver & Set Up',
    copy: 'On the day of your event, we arrive ahead of your guests, deliver every piece, and handle the full setup ourselves. You never have to lift, wire, or assemble anything.',
  },
  {
    title: 'We Pick Up',
    copy: 'Once the celebration wraps, we return and break everything down. No teardown, no rush, no loose ends left for you to handle.',
  },
]

const REQUIREMENTS = [
  {
    title: 'Power',
    copy: 'A standard power outlet within 25 feet of the setup location, indoors or outdoors.',
  },
  {
    title: 'Outdoor Weather',
    copy: 'Outdoor setups require a rain chance under 20% and sustained winds under 10 mph for safety.',
  },
]

export default function HowItWorks() {
  useSEO({
    title: 'How It Works | Sippi Lights Rental Process',
    description:
      'Reserve, we deliver and set up, we pick up. Learn the Sippi Lights rental process and power/weather requirements for indoor and outdoor events.',
  })

  return (
    <div className="px-6 py-20 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs tracking-[0.2em] text-gold uppercase">
          How It Works
        </p>
        <h1 className="mt-4 font-headline text-4xl font-light lg:text-5xl">
          Book It, and We Handle the Rest
        </h1>

        <div className="mt-16 flex flex-col gap-12">
          {STEPS.map((step, i) => (
            <div key={step.title} className="flex gap-6">
              <p className="font-headline text-4xl text-gold">
                {String(i + 1).padStart(2, '0')}
              </p>
              <div>
                <h2 className="text-xl font-medium">{step.title}</h2>
                <p className="mt-2 text-text-muted">{step.copy}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 rounded-card border border-gold/10 bg-charcoal-2 p-8 lg:p-10">
          <h2 className="font-headline text-2xl font-light">
            Indoor &amp; Outdoor Requirements
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {REQUIREMENTS.map((req) => (
              <div key={req.title}>
                <h3 className="text-sm tracking-wide text-gold uppercase">
                  {req.title}
                </h3>
                <p className="mt-2 text-sm text-text-muted">{req.copy}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <Button to="/contact">Check Availability</Button>
        </div>
      </div>
    </div>
  )
}
