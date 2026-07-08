import { useCheckout } from '../../context/CheckoutContext'
import { useBuilder } from '../../context/BuilderContext'
import { estimateDistanceMiles } from '../../data/zipDistances'
import {
  FREE_DELIVERY_RADIUS_MI,
  MAX_RADIUS_MI,
  MIN_MARQUEES_OUTSIDE_25,
  getDeliveryZone,
} from '../../config/pricing'
import { StepNav } from './StepNav'

const inputClass =
  'w-full rounded-button border border-gold/20 bg-charcoal-2 px-4 py-3 text-sm text-warm-white placeholder:text-text-muted focus:border-gold focus:outline-none'

export function StepLogistics() {
  const {
    indoorOutdoor,
    setIndoorOutdoor,
    weatherAck,
    setWeatherAck,
    venueAddress,
    setVenueAddress,
    zip,
    setZip,
    setStep,
  } = useCheckout()
  const { word } = useBuilder()

  const marqueeCount = word.replace(/ /g, '').length
  const distanceMiles = zip.length === 5 ? estimateDistanceMiles(zip) : null
  const zone = distanceMiles !== null ? getDeliveryZone(distanceMiles) : null

  const meetsMinimum = zone !== 'requires-minimum' || marqueeCount >= MIN_MARQUEES_OUTSIDE_25
  const blockedByArea = zone === 'out-of-area'
  const blockedByMinimum = zone === 'requires-minimum' && !meetsMinimum

  const canContinue =
    indoorOutdoor !== '' &&
    (indoorOutdoor === 'indoor' || weatherAck) &&
    venueAddress.trim() !== '' &&
    zip.length === 5 &&
    !blockedByArea &&
    !blockedByMinimum

  return (
    <div>
      <h2 className="font-headline text-2xl font-light">Logistics</h2>

      <div className="mt-6">
        <p className="mb-2 text-xs tracking-[0.15em] text-text-muted uppercase">
          Indoor or Outdoor
        </p>
        <div className="flex gap-3">
          {(['indoor', 'outdoor'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setIndoorOutdoor(option)}
              className={`flex-1 rounded-button border px-4 py-3 text-sm capitalize transition-colors duration-150 ${
                indoorOutdoor === option
                  ? 'border-gold bg-gold text-charcoal'
                  : 'border-gold/20 text-warm-white/80 hover:border-gold/50'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {indoorOutdoor === 'outdoor' && (
        <div className="mt-6 rounded-button border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          <p className="font-medium">Outdoor setup policy</p>
          <p className="mt-2 text-amber-200/90">
            Outdoor setups require a rain chance under 20% and sustained
            winds under 10 mph on your event day, plus a standard power
            outlet within 25 feet of the setup location. If conditions don't
            meet this policy close to your date, we'll work with you to move
            indoors or reschedule.
          </p>
          <label className="mt-3 flex items-start gap-2 text-amber-100">
            <input
              type="checkbox"
              checked={weatherAck}
              onChange={(e) => setWeatherAck(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#C9A84C]"
            />
            I understand and agree to the outdoor setup policy.
          </label>
        </div>
      )}

      <div className="mt-6">
        <label htmlFor="venueAddress" className="mb-2 block text-xs tracking-wide text-text-muted uppercase">
          Venue Address
        </label>
        <input
          id="venueAddress"
          type="text"
          value={venueAddress}
          onChange={(e) => setVenueAddress(e.target.value)}
          placeholder="Street address, city"
          className={inputClass}
        />
      </div>

      <div className="mt-5 max-w-[10rem]">
        <label htmlFor="zip" className="mb-2 block text-xs tracking-wide text-text-muted uppercase">
          ZIP Code
        </label>
        <input
          id="zip"
          type="text"
          inputMode="numeric"
          maxLength={5}
          value={zip}
          onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
          placeholder="39211"
          className={inputClass}
        />
      </div>

      {zip.length === 5 && (
        <div className="mt-4">
          {distanceMiles === null ? (
            <p className="text-sm text-text-muted">
              We couldn't automatically estimate your distance — we'll
              confirm delivery details directly before your date is locked
              in.
            </p>
          ) : zone === 'free' ? (
            <p className="rounded-button border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              Within {FREE_DELIVERY_RADIUS_MI} miles — free delivery ✓
            </p>
          ) : zone === 'requires-minimum' ? (
            <p
              className={`rounded-button border px-4 py-3 text-sm ${
                meetsMinimum
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
              }`}
            >
              {meetsMinimum
                ? `Approved for delivery — orders ${FREE_DELIVERY_RADIUS_MI}–${MAX_RADIUS_MI} miles out require a ${MIN_MARQUEES_OUTSIDE_25}+ marquee minimum, which you've met.`
                : `Delivery ${FREE_DELIVERY_RADIUS_MI}–${MAX_RADIUS_MI} miles out requires a ${MIN_MARQUEES_OUTSIDE_25}+ marquee minimum. Go back to Items and add more, or contact us directly.`}
            </p>
          ) : (
            <p className="rounded-button border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              That's outside our {MAX_RADIUS_MI}-mile service area —{' '}
              <a href="/contact" className="text-red-200 underline">
                contact us directly
              </a>{' '}
              to see what's possible.
            </p>
          )}
        </div>
      )}

      <StepNav
        onBack={() => setStep(2)}
        onNext={() => setStep(4)}
        nextDisabled={!canContinue}
      />
    </div>
  )
}
