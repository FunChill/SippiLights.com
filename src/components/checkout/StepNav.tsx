interface StepNavProps {
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
  nextDisabled?: boolean
  hideBack?: boolean
}

export function StepNav({
  onBack,
  onNext,
  nextLabel = 'Continue',
  nextDisabled,
  hideBack,
}: StepNavProps) {
  return (
    <div className="mt-10 flex items-center justify-between">
      {!hideBack ? (
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-text-muted transition-colors duration-150 hover:text-warm-white"
        >
          ← Back
        </button>
      ) : (
        <span />
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="rounded-button bg-gold px-7 py-3 text-sm font-medium text-charcoal transition-colors duration-200 hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-40"
      >
        {nextLabel}
      </button>
    </div>
  )
}
