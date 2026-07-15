import { useState } from 'react'
import { useCheckout } from '../../context/CheckoutContext'
import { useBuilder } from '../../context/BuilderContext'
import { wordToRequestedItems } from '../../lib/availability'
import { getCharPrice } from '../../data/inventory'
import { calculateDeposit, formatCurrency } from '../../config/pricing'
import { ADD_ON_LABELS } from '../../config/addOns'
import { saveDraft } from '../../lib/checkoutDraft'
import { AGREEMENT_VERSION } from '../../content/rental-agreement'
import { AgreementBox } from './AgreementBox'
import { StepNav } from './StepNav'
import { trackCheckoutStarted } from '../../lib/analytics'

export function StepReview() {
  const checkout = useCheckout()
  const { word, color, numberFinish } = useBuilder()
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'error'>('idle')
  const [agreementAccepted, setAgreementAccepted] = useState(false)

  const requestedItems = wordToRequestedItems(word, numberFinish)
  const marqueeCount = requestedItems.reduce((sum, r) => sum + r.qty, 0)
  const marqueeSubtotal = requestedItems.reduce(
    (sum, r) => sum + (getCharPrice(r.character) ?? 0) * r.qty,
    0,
  )
  const deposit = calculateDeposit(marqueeCount, marqueeSubtotal)
  const balanceDue = marqueeSubtotal - deposit

  const selectedAddOns = (Object.keys(checkout.addOns) as Array<keyof typeof checkout.addOns>).filter(
    (key) => checkout.addOns[key],
  )

  const handleReserve = async () => {
    setSubmitState('submitting')
    trackCheckoutStarted()

    // Persisted so a Stripe cancel (a full page reload) can restore Step 5
    // with the order intact instead of dropping the customer back to blank.
    saveDraft({
      word,
      colorId: color.id,
      numberFinish,
      eventDate: checkout.eventDate,
      addOns: checkout.addOns,
      indoorOutdoor: checkout.indoorOutdoor,
      weatherAck: checkout.weatherAck,
      venueAddress: checkout.venueAddress,
      zip: checkout.zip,
      name: checkout.name,
      phone: checkout.phone,
      email: checkout.email,
      eventType: checkout.eventType,
    })

    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventDate: checkout.eventDate,
          items: requestedItems.map((r) => ({
            itemId: `${r.finish}-${r.character}`,
            character: r.character,
            finish: r.finish,
            qty: r.qty,
            price: getCharPrice(r.character),
          })),
          addOns: selectedAddOns,
          wordBuilt: word,
          ledColor: color.label,
          marqueeSubtotal,
          depositDue: deposit,
          customerName: checkout.name,
          customerPhone: checkout.phone,
          customerEmail: checkout.email,
          eventType: checkout.eventType,
          indoorOutdoor: checkout.indoorOutdoor,
          venueAddress: checkout.venueAddress,
          zip: checkout.zip,
          notes:
            selectedAddOns.length > 0
              ? `Requested add-ons (priced at confirmation): ${selectedAddOns
                  .map((k) => ADD_ON_LABELS[k])
                  .join(', ')}`
              : null,
          agreementName: checkout.name,
          agreementVersion: AGREEMENT_VERSION,
        }),
      })

      if (!res.ok) throw new Error('Checkout session request failed')
      const data = await res.json()
      if (!data.url) throw new Error('No checkout URL returned')
      window.location.href = data.url
    } catch {
      setSubmitState('error')
    }
  }

  return (
    <div>
      <h2 className="font-headline text-2xl font-light">Review &amp; Deposit</h2>

      <div className="mt-6 flex flex-col gap-4 rounded-card border border-gold/10 bg-charcoal-2 p-6">
        <Row label="Event Date" value={checkout.eventDate} />
        <Row label="Event Type" value={checkout.eventType} />
        <Row label="Marquee" value={word || '—'} />
        <Row label="Bulb Color" value={color.label} />
        <Row label="Number Finish" value={numberFinish} />
        {selectedAddOns.length > 0 && (
          <Row
            label="Add-Ons (priced at confirmation)"
            value={selectedAddOns.map((k) => ADD_ON_LABELS[k]).join(', ')}
          />
        )}
        <Row
          label="Setup"
          value={checkout.indoorOutdoor === 'outdoor' ? 'Outdoor' : 'Indoor'}
        />
        <Row label="Venue" value={`${checkout.venueAddress}, ${checkout.zip}`} />
        <Row label="Contact" value={`${checkout.name} · ${checkout.phone} · ${checkout.email}`} />
      </div>

      <div className="mt-6 flex flex-col gap-2 border-t border-gold/10 pt-6 text-sm">
        <div className="flex justify-between text-warm-white/80">
          <span>
            Marquee subtotal ({marqueeCount} × letter/number)
          </span>
          <span>{formatCurrency(marqueeSubtotal)}</span>
        </div>
        <div className="flex justify-between font-medium text-gold">
          <span>Deposit due now</span>
          <span>{formatCurrency(deposit)}</span>
        </div>
        <div className="flex justify-between text-warm-white/80">
          <span>Balance due at delivery</span>
          <span>{formatCurrency(balanceDue)}</span>
        </div>
      </div>

      <AgreementBox
        accepted={agreementAccepted}
        onAcceptedChange={setAgreementAccepted}
        customerName={checkout.name}
      />

      {submitState === 'error' && (
        <p className="mt-4 rounded-button border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Something went wrong starting checkout. Please try again, or call/text
          us directly.
        </p>
      )}

      <StepNav
        onBack={() => checkout.setStep(4)}
        onNext={handleReserve}
        nextLabel={submitState === 'submitting' ? 'Redirecting…' : 'Reserve My Date'}
        nextDisabled={submitState === 'submitting' || !agreementAccepted}
      />
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
      <span className="text-xs tracking-wide text-text-muted uppercase">{label}</span>
      <span className="text-sm text-warm-white">{value}</span>
    </div>
  )
}
