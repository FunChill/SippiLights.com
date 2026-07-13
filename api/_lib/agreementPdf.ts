import { createElement as h } from 'react'
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer'
import { AGREEMENT_INTRO, RENTAL_AGREEMENT } from '../../src/content/rental-agreement.js'

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: 'Helvetica', color: '#1C1B19' },
  brand: { fontSize: 20, marginBottom: 2, color: '#8a6d2f' },
  tagline: { fontSize: 9, marginBottom: 16, color: '#666' },
  h1: { fontSize: 14, marginBottom: 10 },
  meta: { marginBottom: 14, lineHeight: 1.5 },
  sectionTitle: { fontSize: 11, marginTop: 10, marginBottom: 3, fontFamily: 'Helvetica-Bold' },
  para: { marginBottom: 4, lineHeight: 1.5 },
  acceptance: { marginTop: 18, paddingTop: 10, borderTop: '1 solid #999', lineHeight: 1.5 },
})

export interface AgreementPdfData {
  customerName: string
  eventDate: string
  wordBuilt: string | null
  subtotal: number | null
  depositDue: number | null
  acceptedAt: string
  agreementVersion: string
  bookingId: string
}

export async function generateAgreementPdf(data: AgreementPdfData): Promise<Buffer> {
  const doc = h(
    Document,
    null,
    h(
      Page,
      { size: 'LETTER', style: styles.page },
      h(Text, { style: styles.brand }, 'Sippi Lights'),
      h(Text, { style: styles.tagline }, 'Elevated Event Illumination · Jackson, MS'),
      h(Text, { style: styles.h1 }, 'Rental Agreement'),
      h(
        View,
        { style: styles.meta },
        h(Text, null, `Customer: ${data.customerName}`),
        h(Text, null, `Event date: ${data.eventDate}`),
        data.wordBuilt ? h(Text, null, `Marquee display: "${data.wordBuilt}"`) : null,
        data.subtotal != null ? h(Text, null, `Order subtotal: $${data.subtotal}`) : null,
        data.depositDue != null ? h(Text, null, `Deposit: $${data.depositDue}`) : null,
        h(Text, null, `Booking reference: ${data.bookingId}`),
      ),
      h(Text, { style: styles.para }, AGREEMENT_INTRO),
      ...RENTAL_AGREEMENT.flatMap((section) => [
        h(Text, { style: styles.sectionTitle, key: section.title }, section.title),
        ...section.body.map((para, i) =>
          h(Text, { style: styles.para, key: `${section.title}-${i}` }, para),
        ),
      ]),
      h(
        View,
        { style: styles.acceptance },
        h(
          Text,
          null,
          `Accepted electronically by ${data.customerName} on ${data.acceptedAt} (agreement version ${data.agreementVersion}).`,
        ),
      ),
    ),
  )

  // renderToBuffer types expect a DocumentProps element; createElement widens it.
  return renderToBuffer(doc as Parameters<typeof renderToBuffer>[0])
}
