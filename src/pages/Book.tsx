import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useSEO } from '../lib/seo'
import { CheckoutProvider, useCheckout } from '../context/CheckoutContext'
import { StepDate } from '../components/checkout/StepDate'
import { StepItems } from '../components/checkout/StepItems'
import { StepLogistics } from '../components/checkout/StepLogistics'
import { StepContact } from '../components/checkout/StepContact'
import { StepReview } from '../components/checkout/StepReview'

const STEP_LABELS = ['Date', 'Items', 'Logistics', 'Contact', 'Review']

function StepProgress() {
  const { step } = useCheckout()

  return (
    <div className="mb-12 flex items-center justify-between">
      {STEP_LABELS.map((label, i) => {
        const num = i + 1
        const isActive = num === step
        const isDone = num < step
        return (
          <div key={label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-medium transition-colors duration-200 ${
                  isActive
                    ? 'border-gold bg-gold text-charcoal'
                    : isDone
                      ? 'border-gold text-gold'
                      : 'border-gold/20 text-text-muted'
                }`}
              >
                {isDone ? '✓' : num}
              </div>
              <span
                className={`hidden text-[11px] tracking-wide uppercase sm:block ${
                  isActive ? 'text-gold' : 'text-text-muted'
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={`mx-2 h-px flex-1 ${isDone ? 'bg-gold' : 'bg-gold/15'}`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function CheckoutSteps() {
  const { step } = useCheckout()
  const isFirstRender = useRef(true)

  // Each step swaps in place, so without this the customer lands wherever
  // they were scrolled — usually staring at the bottom of the next step.
  // Skipped on first render so arriving at /book doesn't yank the page.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    document.getElementById('checkout-top')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, [step])

  const steps: Record<number, React.ReactNode> = {
    1: <StepDate />,
    2: <StepItems />,
    3: <StepLogistics />,
    4: <StepContact />,
    5: <StepReview />,
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -16 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {steps[step]}
      </motion.div>
    </AnimatePresence>
  )
}

export default function Book() {
  useSEO({
    title: 'Book Your Date | Sippi Lights Jackson MS',
    description:
      'Reserve your marquee letters or numbers online — pick your date, build your word, and pay a deposit to lock it in. Free delivery within 25 miles of Jackson, MS.',
  })

  return (
    <CheckoutProvider>
      <div className="px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs tracking-[0.2em] text-gold uppercase">
            Reserve Your Date
          </p>
          <h1 className="mt-4 font-headline text-4xl font-light lg:text-5xl">
            Book Your Marquee
          </h1>

          <div id="checkout-top" className="mt-12 scroll-mt-24">
            <StepProgress />
            <CheckoutSteps />
          </div>
        </div>
      </div>
    </CheckoutProvider>
  )
}
