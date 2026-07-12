import { AGREEMENT_INTRO, RENTAL_AGREEMENT } from '../../content/rental-agreement'

interface AgreementBoxProps {
  accepted: boolean
  onAcceptedChange: (v: boolean) => void
  customerName: string
}

export function AgreementBox({ accepted, onAcceptedChange, customerName }: AgreementBoxProps) {
  return (
    <div className="mt-8">
      <h3 className="text-sm tracking-[0.15em] text-text-muted uppercase">
        Rental Agreement
      </h3>
      <div className="mt-3 max-h-56 overflow-y-auto rounded-button border border-gold/15 bg-charcoal p-4 text-sm leading-relaxed text-warm-white/80">
        <p>{AGREEMENT_INTRO}</p>
        {RENTAL_AGREEMENT.map((section) => (
          <div key={section.title} className="mt-4">
            <p className="font-medium text-warm-white">{section.title}</p>
            {section.body.map((para, i) => (
              <p key={i} className="mt-2">
                {para}
              </p>
            ))}
          </div>
        ))}
      </div>
      <label className="mt-4 flex items-start gap-3 text-sm text-warm-white/90">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => onAcceptedChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[#C9A84C]"
        />
        <span>
          I, <span className="text-gold">{customerName || 'the customer named above'}</span>, have
          read and agree to the Rental Agreement.
        </span>
      </label>
    </div>
  )
}
