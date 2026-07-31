import { useCheckout } from '../../context/CheckoutContext'
import { useBuilder } from '../../context/BuilderContext'
import { WordBuilder } from '../WordBuilder'
import { AvailabilityStatus } from '../AvailabilityStatus'
import { wordToRequestedItems } from '../../lib/availability'
import { ADD_ON_LABELS } from '../../config/addOns'
import { StepNav } from './StepNav'

const ADD_ONS = (Object.keys(ADD_ON_LABELS) as Array<keyof typeof ADD_ON_LABELS>).map((key) => ({
  key,
  label: ADD_ON_LABELS[key],
}))

export function StepItems() {
  const { eventDate, addOns, toggleAddOn, setStep } = useCheckout()
  const { word, numberFinish } = useBuilder()

  const marqueeCount = word.replace(/ /g, '').length
  const requestedItems = wordToRequestedItems(word, numberFinish)

  return (
    <div>
      <h2 className="font-headline text-2xl font-light">Build Your Order</h2>
      <p className="mt-2 text-sm text-text-muted">
        Type your word or number below — this is what we'll build for you.
      </p>

      <div className="mt-8 rounded-card border border-gold/10 bg-charcoal-2 p-6">
        <WordBuilder showDateField={false} showCTA={false} />
      </div>

      <AvailabilityStatus date={eventDate} requestedItems={requestedItems} />

      <div className="mt-10">
        <h3 className="text-sm tracking-[0.15em] text-text-muted uppercase">
          Add-Ons
        </h3>
        <p className="mt-2 text-sm text-text-muted">
          Request these with your booking — we'll follow up to confirm
          pricing and availability before your deposit is finalized.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {ADD_ONS.map((addOn) => (
            <label
              key={addOn.key}
              className="flex items-center gap-3 rounded-button border border-gold/10 bg-charcoal-2 px-4 py-3 text-sm text-warm-white/80"
            >
              <input
                type="checkbox"
                checked={addOns[addOn.key]}
                onChange={() => toggleAddOn(addOn.key)}
                className="h-4 w-4 accent-[#C9A84C]"
              />
              {addOn.label}
            </label>
          ))}
        </div>
      </div>

      <StepNav
        onBack={() => setStep(1)}
        onNext={() => setStep(3)}
        nextDisabled={marqueeCount === 0}
      />
      {marqueeCount === 0 && (
        <p className="mt-3 text-xs text-text-muted">
          Add at least one letter or number to continue. Only need LED
          uplighting or a stage/arch? <a href="/contact" className="text-gold hover:text-gold-light">Contact us directly</a> instead.
        </p>
      )}
    </div>
  )
}
