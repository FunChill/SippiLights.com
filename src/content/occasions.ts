// Occasion landing pages — the local SEO/AEO layer. Each entry is a real
// 400+ word page targeting occasion + geo. Interlinked via relatedSlugs.

export interface OccasionPage {
  slug: string
  seoTitle: string
  seoDescription: string
  eyebrow: string
  h1: string
  intro: string
  wordExamples: string[]
  sections: Array<{ heading: string; body: string[] }>
  faqQuestions: string[]
  relatedSlugs: string[]
}

export const OCCASIONS: OccasionPage[] = [
  {
    slug: 'birthday-marquee-jackson-ms',
    seoTitle: 'Birthday Marquee Letter Rentals Jackson MS | Sippi Lights',
    seoDescription:
      'Rent glowing marquee letters and numbers for birthdays in Jackson, MS — $70 per marquee with free delivery and setup within 25 miles. Check your date live.',
    eyebrow: 'Birthdays',
    h1: 'Birthday Marquee Rentals in Jackson, MS',
    intro:
      'Nothing announces a birthday like their name or age glowing four feet tall. Sippi Lights delivers, sets up, and picks up marquee letters and numbers across the Jackson metro, so the only thing you handle is the celebration.',
    wordExamples: ['HAPPY 30TH', 'DIRTY 30', '21', 'FAB 40', 'ONE'],
    sections: [
      {
        heading: 'How much do birthday marquee letters cost in Jackson MS?',
        body: [
          'Every marquee letter and number is $70 for your event day, and that price includes delivery, professional setup, and pickup anywhere within 25 miles of Jackson. A big "21" runs $140. A full "HAPPY 30TH" makes a statement wall for $560. You reserve online with a small deposit — a flat $20 for a single marquee, or 25% for larger displays — and pay the balance when we deliver.',
          'There are no hidden fees inside the free-delivery zone, and events 26 to 50 miles out are welcome with a four-marquee minimum.',
        ],
      },
      {
        heading: 'Milestone birthdays are our specialty',
        body: [
          'First birthdays, sweet sixteens, 21sts, dirty thirties, fabulous forties, and every golden birthday in between — numbers are the fastest-booking pieces in our fleet, especially milestone pairs like 3-0 and 5-0 on popular weekends. Numbers come in black or white finishes, letters in classic white, and every LED adjusts to match your party colors: soft warm white for an elegant dinner, hot pink for a sweet sixteen, or color-shifting for the dance floor.',
          'Use the live word builder on our booking page to type the exact name or age, see it glow, and get an instant price before you commit to anything.',
        ],
      },
      {
        heading: 'Indoor parties, backyard bashes, and venue events',
        body: [
          'We set up birthday marquees in living rooms, backyards, banquet halls, and every Jackson-area venue in between — all we need is a standard outlet within 25 feet. Backyard party? Outdoor setups are a go when rain chance is under 20% and winds are under 10 mph, and if the weather turns, we work with you to move indoors or reschedule.',
          'Book as early as you can: birthday dates are first come, first served, and we hold your pieces the moment your deposit lands.',
        ],
      },
    ],
    faqQuestions: [
      'How much does it cost to rent marquee letters in Jackson MS?',
      'How much is the deposit to reserve a date?',
      'What colors and finishes do the marquee letters come in?',
      'Can marquee letters be set up outdoors?',
    ],
    relatedSlugs: ['quinceanera-marquee-jackson-ms', 'graduation-marquee-jackson-ms'],
  },
  {
    slug: 'wedding-marquee-jackson-ms',
    seoTitle: 'Wedding Marquee Letters & Lighting Jackson MS | Sippi Lights',
    seoDescription:
      'MR & MRS marquee letters, LED uplighting, and elegant event lighting for Jackson, MS weddings. Delivered, styled, and picked up — check your date live.',
    eyebrow: 'Weddings',
    h1: 'Wedding Marquee Letters & Lighting in Jackson, MS',
    intro:
      "Your first dance deserves better lighting than a venue fluorescent. From glowing MR & MRS letters behind the head table to uplighting that washes the whole room in your wedding colors, Sippi Lights handles the glow so your planner has one less vendor to chase.",
    wordExamples: ['MR & MRS', 'LOVE', 'I DO', 'FOREVER', 'THE SMITHS'],
    sections: [
      {
        heading: 'What do wedding marquee letters cost in Jackson MS?',
        body: [
          'Marquee letters are $70 each per event day, including delivery, setup, and pickup within 25 miles of Jackson. The classic "MR & MRS" display lands around $420, "LOVE" at $280, and "I DO" at $210 — statement pieces that anchor your reception photos for less than most floral installs.',
          'Reserve with a 25% deposit online, and the balance is due at delivery. Wedding dates book far ahead, especially spring and fall Saturdays, so lock yours in early.',
        ],
      },
      {
        heading: 'Warm white elegance or your exact wedding palette',
        body: [
          'Our letters come in classic white with warm-glow LED lighting that photograph beautifully in dim reception light — no harsh glare, just that golden marquee warmth. If your palette calls for something more, every LED adjusts: blush pink, deep amber, or an exact match to your wedding colors.',
          'Add LED uplighting and the whole room follows suit. Wireless fixtures wash venue walls, columns, and drape in your colors, dialed in on site the day of. Pair with our illuminated 3D arch for a ceremony backdrop or photo moment that guests line up for.',
        ],
      },
      {
        heading: 'We work your venue, your timeline, your planner',
        body: [
          'Reception halls, barns, backyards, and ballrooms across Jackson, Madison, Ridgeland, Brandon, and the wider metro — we coordinate arrival around your venue access window and have everything glowing before the first guest walks in. After the send-off, we come back and break it all down. You never touch a cord.',
          'All we need is a standard outlet within 25 feet of the display. Outdoor ceremonies follow our weather policy: under 20% rain chance and winds under 10 mph, with an indoor move or reschedule if the sky disagrees.',
        ],
      },
    ],
    faqQuestions: [
      'How much does it cost to rent marquee letters in Jackson MS?',
      'Is setup and teardown included?',
      'What are the power requirements for marquee letters?',
      'What is the cancellation policy?',
    ],
    relatedSlugs: ['birthday-marquee-jackson-ms', 'corporate-event-lighting-jackson-ms'],
  },
  {
    slug: 'quinceanera-marquee-jackson-ms',
    seoTitle: 'Quinceañera Marquee Numbers & Lighting Jackson MS | Sippi Lights',
    seoDescription:
      'Glowing 15 marquee numbers, custom-color uplighting, and event lighting for quinceañeras in Jackson, MS. $70 per marquee, delivered and set up free within 25 miles.',
    eyebrow: 'Quinceañeras',
    h1: 'Quinceañera Marquee & Lighting Rentals in Jackson, MS',
    intro:
      "Fifteen only happens once. A glowing MIS QUINCE or a four-foot 15 in her exact dress color turns the reception entrance into the photo everyone posts — and Sippi Lights delivers, sets up, and picks up so the family stays focused on the celebration.",
    wordExamples: ['15', 'MIS QUINCE', 'ISABELLA', 'XV', 'QUINCE'],
    sections: [
      {
        heading: 'How much does quinceañera marquee lighting cost in Jackson MS?',
        body: [
          'Marquee numbers and letters are $70 each per event day with free delivery, setup, and pickup within 25 miles of Jackson. The iconic glowing "15" is $140; her name in lights runs $70 per letter. Reserve online with a deposit — flat $20 for a single piece, 25% for bigger displays — and settle the balance at delivery.',
          'Quinceañera season weekends book quickly, so the earlier you reserve, the safer her date.',
        ],
      },
      {
        heading: 'Matched to her dress, down to the LED',
        body: [
          "Every quinceañera has a color story, and our LEDs follow it. Choose the glow when you book — rose gold, lavender, royal blue, hot pink, or classic warm white — and we dial it in at setup so the 15 matches the dress, the cake, and the dama dresses in every photo.",
          'Numbers come in black or white finishes. Add LED uplighting and the venue walls carry her color from the entrance to the dance floor, or frame the head table with our illuminated arch for the crown moment.',
        ],
      },
      {
        heading: 'Venues, halls, and backyards across the metro',
        body: [
          'From reception halls in Jackson and Pearl to family backyards in Byram and Clinton, we set up wherever the party is — any spot with a standard outlet within 25 feet works. Outdoor receptions follow our weather policy (under 20% rain, under 10 mph wind), and we coordinate with your hall’s access hours so the lights are glowing before guests arrive.',
          'Setup and teardown are always included. The family never lifts a marquee.',
        ],
      },
    ],
    faqQuestions: [
      'How much is the deposit to reserve a date?',
      'What colors and finishes do the marquee letters come in?',
      'Do you deliver marquee letters in the Jackson metro area?',
      'How far in advance should I book?',
    ],
    relatedSlugs: ['birthday-marquee-jackson-ms', 'wedding-marquee-jackson-ms'],
  },
  {
    slug: 'corporate-event-lighting-jackson-ms',
    seoTitle: 'Corporate Event Lighting & Marquee Rentals Jackson MS | Sippi Lights',
    seoDescription:
      'Branded marquee letters, stage lighting, and LED uplighting for corporate events, galas, and grand openings in Jackson, MS. Professional setup included.',
    eyebrow: 'Corporate & Business',
    h1: 'Corporate Event Lighting in Jackson, MS',
    intro:
      'Company initials glowing behind the check-in table. Uplighting in brand colors. A lit stage for the awards moment. Sippi Lights gives Jackson-area corporate events a professional glow with zero lift from your events team — delivered, set up, and struck on your schedule.',
    wordExamples: ['GRAND OPENING', 'SALES 2026', 'ACME CO', '10 YEARS', 'GALA'],
    sections: [
      {
        heading: 'What does corporate event lighting cost in Jackson MS?',
        body: [
          'Marquee letters and numbers run $70 each per event day — spell out company initials, an anniversary year, or GRAND OPENING across the entrance. Delivery, setup, and teardown are included within 25 miles of Jackson, and invoicing is clean: deposit online to hold the date, balance at delivery.',
          'LED uplighting and stage packages are quoted per event based on your venue and footprint — request them with your booking and we confirm pricing within a day.',
        ],
      },
      {
        heading: 'Brand colors, not close-enough colors',
        body: [
          'Every marquee LED and uplight fixture adjusts to your exact brand palette on site. Holiday party gold, company-blue product launch, or a red-carpet awards night — we tune the room to the brand standard your marketing team will actually approve.',
          'Our fixtures are wireless, so venue layouts stay flexible: wash the ballroom columns, frame the stage, or line the entry walk without a cord in sight.',
        ],
      },
      {
        heading: 'Galas, grand openings, holiday parties, retreats',
        body: [
          'We light corporate calendars across the metro — awards galas in downtown Jackson, grand openings in Flowood and Madison, holiday parties in Ridgeland, team events in Brandon. Setup is coordinated with your venue window, and we return for teardown after your event wraps, whether that is 5 PM or midnight.',
          'Power needs are simple: one standard outlet within 25 feet per display cluster, with roughly nine marquee characters per breaker. Your facilities contact will not get a surprise.',
        ],
      },
    ],
    faqQuestions: [
      'Is setup and teardown included?',
      'What are the power requirements for marquee letters?',
      'What payment methods do you accept?',
      'How long is the rental period?',
    ],
    relatedSlugs: ['wedding-marquee-jackson-ms', 'graduation-marquee-jackson-ms'],
  },
  {
    slug: 'graduation-marquee-jackson-ms',
    seoTitle: 'Graduation Marquee Letters Jackson MS | Class of 2026 | Sippi Lights',
    seoDescription:
      'CLASS OF 2026 marquee letters, grad year numbers, and party lighting for graduations in Jackson, MS. $70 per marquee with free delivery within 25 miles.',
    eyebrow: 'Graduations',
    h1: 'Graduation Marquee Rentals in Jackson, MS',
    intro:
      "They earned the tassel — give the party a backdrop to match. Glowing CLASS OF 2026 letters, a four-foot grad year, or their name in lights in school colors: Sippi Lights delivers and sets up across the Jackson metro while you handle the guest list.",
    wordExamples: ['CLASS OF 2026', 'GRAD', '2026', 'SENIORS', 'JSU BOUND'],
    sections: [
      {
        heading: 'How much do graduation marquee letters cost in Jackson MS?',
        body: [
          'Every letter and number is $70 for your event day — a glowing "2026" is $280, "GRAD" is $280, and the full "CLASS OF 2026" statement runs $770. Delivery, setup, and pickup are free within 25 miles of Jackson, and a deposit online locks your date: flat $20 for one marquee, 25% for larger displays.',
          'Graduation weekends are the busiest stretch of our calendar. May dates go first come, first served — book the moment the ceremony date is announced.',
        ],
      },
      {
        heading: 'School colors on command',
        body: [
          'every LED adjusts to the school palette — purple and gold, maroon and white, navy and silver, or whatever banner they are walking under next fall. Letters come in classic white and numbers in black or white, so the display reads sharp in daylight and glows in every nighttime photo.',
          'Type the grad’s name or year into our live word builder to preview the display and price before you book anything.',
        ],
      },
      {
        heading: 'Backyards, church halls, and venue parties',
        body: [
          'Most graduation parties we light are backyard setups — all we need is a standard outlet within 25 feet, and roughly nine characters run on a single breaker. Outdoor setups follow our weather policy (under 20% rain chance, winds under 10 mph), with an indoor move or reschedule if a Mississippi spring storm rolls through.',
          'We deliver across Jackson, Byram, Clinton, Pearl, Brandon, Madison, Ridgeland, and Flowood, set everything up before guests arrive, and pick it all up after the last photo.',
        ],
      },
    ],
    faqQuestions: [
      'How much does it cost to rent marquee letters in Jackson MS?',
      'How far in advance should I book?',
      'Can marquee letters be set up outdoors?',
      'What happens if it rains on my event day?',
    ],
    relatedSlugs: ['birthday-marquee-jackson-ms', 'corporate-event-lighting-jackson-ms'],
  },
]

export function getOccasionBySlug(slug: string): OccasionPage | undefined {
  return OCCASIONS.find((o) => o.slug === slug)
}
