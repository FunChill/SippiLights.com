/**
 * Client-side PDF rendering for playbook entries. Kept in its own module and
 * loaded with a dynamic import() — @react-pdf/renderer is heavy, and it should
 * only download when the owner actually clicks "PDF", not with the admin page.
 */
import { createElement as h } from 'react'
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import type { PlaybookEntry } from '../content/playbook'

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, fontFamily: 'Helvetica', color: '#1C1B19', lineHeight: 1.5 },
  brand: { fontSize: 18, marginBottom: 2, color: '#8a6d2f' },
  sub: { fontSize: 9, color: '#777777', marginBottom: 18 },
  category: { fontSize: 9, color: '#8a6d2f', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
  title: { fontSize: 15, marginBottom: 14, fontFamily: 'Helvetica-Bold' },
  stepRow: { flexDirection: 'row', marginBottom: 8 },
  stepNum: { width: 22, fontFamily: 'Helvetica-Bold', color: '#8a6d2f' },
  stepText: { flex: 1 },
  notes: { marginTop: 16, padding: 10, backgroundColor: '#f5f5f2', borderRadius: 4, fontSize: 10 },
  notesLabel: { fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  footer: { position: 'absolute', bottom: 28, left: 48, right: 48, fontSize: 8, color: '#999999' },
})

export async function playbookEntryPdf(entry: PlaybookEntry): Promise<Blob> {
  const doc = h(
    Document,
    null,
    h(
      Page,
      { size: 'LETTER', style: styles.page },
      h(Text, { style: styles.brand }, 'Sippi Lights'),
      h(Text, { style: styles.sub }, 'Operations Playbook · Jackson, MS · (601) 813-2464'),
      h(Text, { style: styles.category }, entry.category),
      h(Text, { style: styles.title }, entry.title),
      ...entry.steps.map((step, i) =>
        h(
          View,
          { key: i, style: styles.stepRow },
          h(Text, { style: styles.stepNum }, String(i + 1)),
          h(Text, { style: styles.stepText }, step),
        ),
      ),
      entry.notes
        ? h(
            View,
            { style: styles.notes },
            h(Text, { style: styles.notesLabel }, 'Notes'),
            h(Text, null, entry.notes),
          )
        : null,
      h(Text, { style: styles.footer, fixed: true }, 'Sippi Lights — internal operations document'),
    ),
  )

  // @react-pdf/renderer's types expect its own ReactElement flavor.
  return pdf(doc as Parameters<typeof pdf>[0]).toBlob()
}
