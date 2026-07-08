import { useCheckout } from '../../context/CheckoutContext'
import { StepNav } from './StepNav'

const EVENT_TYPES = [
  'Birthday',
  'Wedding',
  'Anniversary',
  'Graduation',
  'Baby Shower',
  'Corporate Event',
  'Other',
]

const inputClass =
  'w-full rounded-button border border-gold/20 bg-charcoal-2 px-4 py-3 text-sm text-warm-white placeholder:text-text-muted focus:border-gold focus:outline-none'

export function StepContact() {
  const { name, setName, phone, setPhone, email, setEmail, eventType, setEventType, setStep } =
    useCheckout()

  const canContinue = name.trim() !== '' && phone.trim() !== '' && email.trim() !== '' && eventType !== ''

  return (
    <div>
      <h2 className="font-headline text-2xl font-light">Your Contact Info</h2>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contactName" className="mb-2 block text-xs tracking-wide text-text-muted uppercase">
            Name
          </label>
          <input
            id="contactName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="contactPhone" className="mb-2 block text-xs tracking-wide text-text-muted uppercase">
            Phone
          </label>
          <input
            id="contactPhone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(601) 000-0000"
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="contactEmail" className="mb-2 block text-xs tracking-wide text-text-muted uppercase">
          Email
        </label>
        <input
          id="contactEmail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className={inputClass}
        />
      </div>

      <div className="mt-5">
        <label htmlFor="contactEventType" className="mb-2 block text-xs tracking-wide text-text-muted uppercase">
          Event Type
        </label>
        <select
          id="contactEventType"
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          className={inputClass}
        >
          <option value="" disabled>
            Select event type
          </option>
          {EVENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <StepNav onBack={() => setStep(3)} onNext={() => setStep(5)} nextDisabled={!canContinue} />
    </div>
  )
}
