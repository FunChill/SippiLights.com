// FAQ content — single source for the /faq page, the Home accordion, and
// FAQPage JSON-LD. Every answer is written answer-first (2–3 quotable
// sentences) so AI assistants can cite it directly.

export interface FaqItem {
  question: string
  answer: string
  category: string
}

export const FAQ_CATEGORIES = [
  'Pricing & Booking',
  'Delivery & Setup',
  'Power & Placement',
  'Weather & Outdoor Events',
  'The Marquees',
] as const

export const FAQ_ITEMS: FaqItem[] = [
  {
    category: 'Pricing & Booking',
    question: 'How much does it cost to rent marquee letters in Jackson MS?',
    answer:
      'Marquee letters and numbers rent for $70 each per event day from Sippi Lights in Jackson, MS. Delivery, professional setup, and pickup are all included in that price within 25 miles of Jackson.',
  },
  {
    category: 'Pricing & Booking',
    question: 'How much is the deposit to reserve a date?',
    answer:
      'A single-marquee booking takes a flat $20 deposit, and orders of two or more marquees take a 25% deposit. The remaining balance is due at delivery, and you can book and pay your deposit online in about two minutes.',
  },
  {
    category: 'Pricing & Booking',
    question: 'What is the cancellation policy?',
    answer:
      'Cancel 14 or more days before your event and your deposit is refunded in full. Within 14 days of your event, your deposit becomes a credit toward a future booking, valid for 60 days.',
  },
  {
    category: 'Pricing & Booking',
    question: 'How far in advance should I book?',
    answer:
      'Book as early as possible — dates are first come, first served, and popular weekends fill up fast. You can check any date instantly with the live availability checker on our booking page.',
  },
  {
    category: 'Pricing & Booking',
    question: 'What payment methods do you accept?',
    answer:
      'Deposits are paid securely online by card through Stripe. The remaining balance is due at delivery and can be paid by card or cash.',
  },
  {
    category: 'Pricing & Booking',
    question: 'How long is the rental period?',
    answer:
      'Your rental covers one full calendar day — the day of your event. We deliver and set up before your celebration and return afterward to pick everything up, so you get the lights for the moments that matter.',
  },
  {
    category: 'Delivery & Setup',
    question: 'Do you deliver marquee letters in the Jackson metro area?',
    answer:
      'Yes — delivery is free within 25 miles of Jackson, MS, which covers Brandon, Ridgeland, Madison, Pearl, Flowood, Clinton, and Byram. Events 26–50 miles out are welcome too with a four-marquee minimum.',
  },
  {
    category: 'Delivery & Setup',
    question: 'Is setup and teardown included?',
    answer:
      'Always. Sippi Lights personally delivers, sets up, and picks up every rental — you never assemble, wire, or move anything. We arrive before your event and handle the entire display from start to finish.',
  },
  {
    category: 'Power & Placement',
    question: 'What are the power requirements for marquee letters?',
    answer:
      'You need a standard power outlet within 25 feet of the setup spot — that’s it. Roughly nine marquee characters can run on a single standard breaker, so a typical home or venue outlet handles most displays easily.',
  },
  {
    category: 'Power & Placement',
    question: 'Can guests move the marquee letters during the event?',
    answer:
      'No — once set up, displays should stay put for safety. If something needs to move, call or text us and we’ll handle the relocation ourselves.',
  },
  {
    category: 'Weather & Outdoor Events',
    question: 'Can marquee letters be set up outdoors?',
    answer:
      'Yes, outdoor setups are welcome when the forecast shows under a 20% chance of rain and winds under 10 mph. If weather turns unsafe, we’ll work with you to move the display indoors or reschedule — and refund your deposit if neither works.',
  },
  {
    category: 'Weather & Outdoor Events',
    question: 'What happens if it rains on my event day?',
    answer:
      'We watch the forecast with you in the days before your event. If rain makes an outdoor setup unsafe, we move it indoors, reschedule, or refund your deposit in full — you’re never stuck.',
  },
  {
    category: 'The Marquees',
    question: 'What colors and finishes do the marquee letters come in?',
    answer:
      'Letters come in classic white, and numbers come in black or white. Every marquee’s LED lighting is adjustable to any color, so the glow can match your event’s exact color scheme.',
  },
  {
    category: 'The Marquees',
    question: 'What are the marquee letters made of?',
    answer:
      'Our marquees are professionally built letter and number frames about four feet tall, lit with warm LED strip lighting — not bulbs. They’re freestanding, sturdy, and photograph beautifully day or night.',
  },
]
