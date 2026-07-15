import { useEffect } from 'react'
import { useSEO } from '../lib/seo'
import { Button } from '../components/Button'
import { SITE } from '../lib/site'
import { trackBookingCompleted } from '../lib/analytics'

export default function BookConfirmed() {
  useSEO({
    title: 'Booking Confirmed | Sippi Lights',
    description: 'Your Sippi Lights deposit was received and your date is reserved.',
  })

  useEffect(() => {
    trackBookingCompleted()
  }, [])

  return (
    <div className="px-6 py-24 lg:px-10">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-xs tracking-[0.2em] text-gold uppercase">
          You're Booked
        </p>
        <h1 className="mt-4 font-headline text-4xl font-light lg:text-5xl">
          Your date is{' '}
          <span className="text-gold italic">locked in.</span>
        </h1>
        <p className="mt-6 text-text-muted">
          Your deposit was received and your date is reserved. We'll be in
          touch to confirm final details before your event — the remaining
          balance is due at delivery.
        </p>
        <p className="mt-4 text-text-muted">
          Questions in the meantime? Call or text {SITE.phone}.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Button to="/">Back to Home</Button>
          <Button to="/portfolio" variant="ghost">
            View Our Work
          </Button>
        </div>
      </div>
    </div>
  )
}
