import { useState } from 'react'
import { useCheckout } from '../../context/CheckoutContext'
import { useBuilder } from '../../context/BuilderContext'
import { wordToRequestedItems } from '../../lib/availability'
import { getCharPrice } from '../../data/inventory'
import {
  MAX_RADIUS_MI,
  calculateDeposit,
  calculateTravelFee,
  clampPaymentAmount,
  formatCurrency,
} from '../../config/pricing'
import { estimateDistanceMiles } from '../../data/zipDistances'
import { ADD_ON_LABELS } from '../../config/addOns'
import { saveDraft } from '../../lib/checkoutDraft'
import { AGREEMENT_VERSION } from '../../content/rental-agreement'
import { AgreementBox } from './AgreementBox'
import { StepNav } from './StepNav'
import { trackCheckoutStarted, trackInquirySubmitted } from '../../lib/analytics'

export function StepReview() {
  const checkout = useCheckout()
  const { word, color, numberFinish } = useBuilder()
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'error'>('idle')
  const [agreementAccepted, setAgreementAccepted] = useState(false)
  const [inquiryState, setInquiryState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  // null = pay the minimum. A number = customer chose to pay more.
  const [chosenAmount, setChosenAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')

  const requestedItems = wordToRequestedItems(word, numberFinish)
  const marqueeCount = requestedItems.reduce((sum, r) => sum + r.qty, 0)
  const marqueeSubtotal = requestedItems.reduce(
    (sum, r) => sum + (getCharPrice(r.character) ?? 0) * r.qty,
    0,
  )
  const deposit = calculateDeposit(marqueeCount, marqueeSubtotal)
  const distanceMiles = checkout.zip.length === 5 ? estimateDistanceMiles(checkout.zip) : null
  const travelFee = calculateTravelFee(distanceMiles)
  const orderTotal = marqueeSubtotal + travelFee
  // Travel fee rides with the balance, never the deposit — the deposit rule
  // stays purely marquee-based ($20 single / 25% multi).
  const hasNumbers = /[0-9]/.test(word)

  // The deposit is the FLOOR, not the fixed charge — customers can pay any
  // amount from the minimum up to the full order total.
  const amountDueNow = clampPaymentAmount(chosenAmount ?? deposit, deposit, orderTotal)
  const balanceDue = orderTotal - amountDueNow
  const payingInFull = balanceDue === 0
  const halfAmount = Math.round(orderTotal / 2)
  const presets = [
    { label: 'Minimum', value: deposit },
    // Only offer Half when it sits meaningfully between the minimum and full.
    ...(halfAmount > deposit && halfAmount < orderTotal
      ? [{ label: 'Half', value: halfAmount }]
      : []),
    { label: 'Pay in full', value: orderTotal },
  ]

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
      city: checkout.city,
      state: checkout.state,
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
          amountToPay: amountDueNow,
          customerName: checkout.name,
          customerPhone: checkout.phone,
          customerEmail: checkout.email,
          eventType: checkout.eventType,
          indoorOutdoor: checkout.indoorOutdoor,
          venueAddress: checkout.fullVenueAddress,
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

  const handleSaveInquiry = async () => {
    setInquiryState('saving')
    try {
      const res = await fetch('/api/save-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventDate: checkout.eventDate,
          items: requestedItems.map((r) => ({
            character: r.character,
            finish: r.finish,
            qty: r.qty,
          })),
          wordBuilt: word,
          ledColor: color.label,
          customerName: checkout.name,
          customerPhone: checkout.phone,
          customerEmail: checkout.email,
          eventType: checkout.eventType,
          indoorOutdoor: checkout.indoorOutdoor,
          venueAddress: checkout.fullVenueAddress,
          zip: checkout.zip,
          notes:
            selectedAddOns.length > 0
              ? `Interested in add-ons: ${selectedAddOns.map((k) => ADD_ON_LABELS[k]).join(', ')}`
              : null,
        }),
      })
      if (!res.ok) throw new Error('save failed')
      trackInquirySubmitted()
      setInquiryState('saved')
    } catch {
      setInquiryState('error')
    }
  }

  return (
    <div>
      <h2 className="font-headline text-2xl font-light">Review &amp; Deposit</h2>

      <div className="mt-6 flex flex-col gap-4 rounded-card border border-gold/10 bg-charcoal-2 p-6">
        <Row label="Event Date" value={checkout.eventDate} />
        <Row label="Event Type" value={checkout.eventType} />
        <Row label="Marquee" value={word || '—'} />
        <Row label="LED color" value={color.label} />
        {hasNumbers && <Row label="Number Finish" value={numberFinish} />}
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
        <Row label="Venue" value={checkout.fullVenueAddress} />
        <Row label="Contact" value={`${checkout.name} · ${checkout.phone} · ${checkout.email}`} />
      </div>

      <div className="mt-6 flex flex-col gap-2 border-t border-gold/10 pt-6 text-sm">
        <div className="flex justify-between text-warm-white/80">
          <span>
            Marquee subtotal ({marqueeCount} × letter/number)
          </span>
          <span>{formatCurrency(marqueeSubtotal)}</span>
        </div>
        {travelFee > 0 && (
          <div className="flex justify-between text-warm-white/80">
            <span>Travel fee (26–{MAX_RADIUS_MI} miles)</span>
            <span>{formatCurrency(travelFee)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-gold/10 pt-2 text-warm-white">
          <span>Order total</span>
          <span>{formatCurrency(orderTotal)}</span>
        </div>
      </div>

      {/* Deposit is the minimum, not the ceiling — some customers would rather
          settle up now than deal with a balance on event day. */}
      <div className="mt-6 rounded-card border border-gold/15 bg-charcoal-2 p-5">
        <p className="text-xs tracking-[0.15em] text-text-muted uppercase">How much to pay now</p>
        <p className="mt-1 text-xs text-text-muted">
          {formatCurrency(deposit)} minimum reserves your date — pay more now if you'd rather
          not settle up at delivery.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {presets.map((preset) => {
            const active = amountDueNow === preset.value && customAmount === ''
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setCustomAmount('')
                  setChosenAmount(preset.value)
                }}
                className={`rounded-button border px-4 py-2 text-sm transition-colors duration-150 ${
                  active
                    ? 'border-gold bg-gold font-medium text-charcoal'
                    : 'border-gold/20 text-warm-white/80 hover:border-gold/50'
                }`}
              >
                {preset.label} · {formatCurrency(preset.value)}
              </button>
            )
          })}
          <label className="flex items-center gap-2 rounded-button border border-gold/20 px-3 py-2 text-sm">
            <span className="text-text-muted">Other $</span>
            <input
              type="number"
              inputMode="decimal"
              min={deposit}
              max={orderTotal}
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value)
                const parsed = Number(e.target.value)
                setChosenAmount(e.target.value === '' ? null : parsed)
              }}
              placeholder={String(deposit)}
              className="w-20 bg-transparent text-warm-white focus:outline-none"
            />
          </label>
        </div>

        {customAmount !== '' && Number(customAmount) !== amountDueNow && (
          <p className="mt-2 text-xs text-amber-300">
            Adjusted to {formatCurrency(amountDueNow)} — the minimum is{' '}
            {formatCurrency(deposit)} and the most you can pay now is {formatCurrency(orderTotal)}.
          </p>
        )}

        <div className="mt-4 flex flex-col gap-2 border-t border-gold/10 pt-4 text-sm">
          <div className="flex justify-between font-medium text-gold">
            <span>Paying now</span>
            <span>{formatCurrency(amountDueNow)}</span>
          </div>
          <div className="flex justify-between text-warm-white/80">
            <span>{payingInFull ? 'Balance at delivery' : 'Balance due at delivery'}</span>
            <span>{payingInFull ? 'Paid in full ✓' : formatCurrency(balanceDue)}</span>
          </div>
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

      {/* The warm-lead path: someone who built a whole order but hasn't
          settled their date shouldn't have to abandon the page. */}
      <div className="mt-6 border-t border-gold/10 pt-6">
        {inquiryState === 'saved' ? (
          <p className="rounded-button border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            Saved — check your email. Nothing's booked and nothing's owed; we'll
            check back in a couple of weeks. Ready sooner? Just hit Reserve My Date.
          </p>
        ) : (
          <>
            <p className="text-sm text-text-muted">
              Date not set in stone yet? Save this setup and we'll hold onto the
              details — no payment, no commitment.
            </p>
            <button
              type="button"
              onClick={handleSaveInquiry}
              disabled={inquiryState === 'saving' || submitState === 'submitting'}
              className="mt-3 rounded-button border border-gold/40 px-5 py-2.5 text-sm text-gold hover:bg-gold hover:text-charcoal disabled:opacity-50"
            >
              {inquiryState === 'saving' ? 'Saving…' : 'Save my setup for later'}
            </button>
            {inquiryState === 'error' && (
              <p className="mt-2 text-xs text-red-300">
                Couldn't save that — please try again, or call/text us.
              </p>
            )}
          </>
        )}
      </div>
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
