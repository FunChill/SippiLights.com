/**
 * Phase 10 — snapshot tests for the business rules a drafted reply must never
 * break. Deliberately a plain script rather than a test framework: it needs no
 * new dependency, and a future owner can run it with one command.
 *
 *   npx tsx scripts/test-reply-rules.mts
 *
 * These run against a FIXED fact sheet, so they test the rules themselves, not
 * the database. Nothing here calls a model or spends money.
 */
import {
  validateDraftAgainstFacts,
  type FactSheet,
} from '../api/_lib/factSheet.js'

let passed = 0
let failed = 0

function expectBlocked(label: string, draft: string, sheet: FactSheet) {
  const warnings = validateDraftAgainstFacts(draft, sheet)
  if (warnings.length > 0) {
    passed++
    console.log(`  PASS  ${label}`)
  } else {
    failed++
    console.log(`  FAIL  ${label}\n        draft slipped through: ${JSON.stringify(draft)}`)
  }
}

function expectClean(label: string, draft: string, sheet: FactSheet) {
  const warnings = validateDraftAgainstFacts(draft, sheet)
  if (warnings.length === 0) {
    passed++
    console.log(`  PASS  ${label}`)
  } else {
    failed++
    console.log(`  FAIL  ${label}\n        false positive: ${warnings.join(' | ')}`)
  }
}

/**
 * Three marquees in the 26-50 mile zone: $210 subtotal, $53 deposit, $35
 * travel fee. Chosen because it exercises every role at once.
 */
const SHEET: FactSheet = {
  text: '(fixed fixture)',
  facts: [],
  allowedAmounts: [
    { value: 70, role: 'per-marquee' },
    { value: 210, role: 'subtotal' },
    { value: 53, role: 'deposit' },
    { value: 35, role: 'travel-fee' },
  ],
  allowedDates: ['2026-09-19'],
  unknowns: [],
}

console.log('\nRule 1 — never reveal WHY something is unavailable')
expectBlocked('"already booked"', 'Those letters are already booked for that date.', SHEET)
expectBlocked('"another customer"', 'Another customer has the J that weekend.', SHEET)
expectBlocked('reveals fleet size', 'We only own 4 of those letters.', SHEET)
expectBlocked('"sold out"', 'Sorry, the Y is sold out that day.', SHEET)
expectClean('approved phrasing', 'The letter "J" is not available for that date.', SHEET)

console.log('\nRule 2 — lead-time wording (the two approved sentences pass)')
expectClean(
  '14+ days: may need special scheduling',
  'The letters "Z", "Q" may need special scheduling for that date — reach out and we\'ll confirm within 24 hours.',
  SHEET,
)
expectClean('inside 14 days: not available', 'The letter "Z" is not available for that date.', SHEET)

console.log('\nRule 3 — travel fee is due at delivery, never in the deposit')
expectClean(
  'correct: $35 travel fee at delivery, $53 deposit',
  'The deposit is $53 to reserve the date, and there is a $35 travel fee collected with the balance at delivery.',
  SHEET,
)
expectBlocked(
  'travel fee stated as the deposit amount',
  'Your travel fee is $53.',
  SHEET,
)
expectBlocked(
  'deposit inflated to include the travel fee',
  'The deposit is $88 which covers the travel fee too.',
  SHEET,
)

console.log('\nRule 4 — add-ons never get a quoted number')
expectBlocked('invents an uplighting price', 'LED uplighting runs $150 for the evening.', SHEET)
expectBlocked('invents a stage price', 'The stage is $250.', SHEET)
expectClean(
  'correct: priced at confirmation',
  'LED uplighting, the stage, and the arch are priced at confirmation — I\'ll confirm those with you before anything is finalised.',
  SHEET,
)

console.log('\nRule 5 — never imply a date is held without a deposit')
expectBlocked('"I\'ll hold the date"', "I'll hold the date for you until Friday.", SHEET)
expectBlocked('"reserved for you"', 'That date is reserved for you.', SHEET)
expectBlocked('"holding it for you"', "I'm holding it for you in the meantime.", SHEET)
expectClean(
  'correct: nothing held until deposit',
  'Nothing is reserved until the deposit is paid, so the date is open until then.',
  SHEET,
)

console.log('\nRule 6 — invented figures are blocked outright')
expectBlocked('price the customer asserted', 'You\'re right, we can do it for $10.', SHEET)
expectBlocked('plausible but wrong total', 'That comes to $200 all in.', SHEET)
expectClean('every figure on the sheet', 'Marquees are $70 each, so $210 for three.', SHEET)

console.log('\nRule 7 — never propose an alternative date (Walt decides that)')
expectBlocked('suggests a different day', 'That one is tight, but how about September 26 instead?', SHEET)
expectBlocked('suggests a numeric date', 'We could do 9/26 if that works.', SHEET)
expectBlocked('suggests an ISO date', 'Would 2026-10-03 suit you better?', SHEET)
expectClean('restates their own date', 'For September 19, everything you asked for is available.', SHEET)
expectClean('their date, short month form', 'Sept 19 works — here is what it comes to.', SHEET)
expectClean(
  'offers to follow up if it frees up, without naming a new date',
  "That one may need special scheduling. Want me to reach out if it opens up? Nothing's held either way.",
  SHEET,
)

console.log('\nRule 8 — out of area declines politely, without referring elsewhere')
const OUT_OF_AREA: FactSheet = {
  ...SHEET,
  allowedAmounts: [{ value: 70, role: 'per-marquee' }],
  allowedDates: [],
}
expectBlocked('quotes a price anyway', 'We can come out for $210.', OUT_OF_AREA)
expectClean(
  'gracious decline',
  "Thanks so much for checking with us — unfortunately you're outside the area we cover, so we have to pass on this one. Hope it's a great celebration.",
  OUT_OF_AREA,
)

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
