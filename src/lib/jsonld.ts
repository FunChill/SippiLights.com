import { useEffect } from 'react'
import { FAQ_ITEMS } from '../content/faq'
import { SITE } from './site'

/** Injects JSON-LD script tags for the current page; removes them on unmount so schemas never leak between routes. */
export function useJsonLd(schemas: object[]) {
  useEffect(() => {
    const tags = schemas.map((schema) => {
      const tag = document.createElement('script')
      tag.type = 'application/ld+json'
      tag.setAttribute('data-jsonld', 'true')
      tag.textContent = JSON.stringify(schema)
      document.head.appendChild(tag)
      return tag
    })
    return () => tags.forEach((tag) => tag.remove())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(schemas)])
}

export const LOCAL_BUSINESS_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  additionalType: 'https://schema.org/HomeAndConstructionBusiness',
  name: 'Sippi Lights',
  description:
    'Marquee letter and number rentals, LED uplighting, and event lighting for birthdays, weddings, and celebrations in the Jackson, MS metro.',
  url: 'https://sippilights.com',
  telephone: '+16018132464',
  email: SITE.email,
  priceRange: '$70+',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Jackson',
    addressRegion: 'MS',
    postalCode: '39211',
    addressCountry: 'US',
  },
  geo: { '@type': 'GeoCoordinates', latitude: 32.3667, longitude: -90.1372 },
  areaServed: [
    'Jackson MS',
    'Brandon MS',
    'Ridgeland MS',
    'Madison MS',
    'Pearl MS',
    'Flowood MS',
    'Clinton MS',
    'Byram MS',
  ].map((name) => ({ '@type': 'City', name })),
  serviceArea: {
    '@type': 'GeoCircle',
    geoMidpoint: { '@type': 'GeoCoordinates', latitude: 32.3667, longitude: -90.1372 },
    geoRadius: '80467', // 50 miles in meters
  },
  sameAs: [SITE.facebook, SITE.instagram],
}

export const FAQ_PAGE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer },
  })),
}

export function serviceSchema(name: string, description: string, price: number | null) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: name,
    description,
    provider: { '@type': 'LocalBusiness', name: 'Sippi Lights' },
    areaServed: { '@type': 'City', name: 'Jackson MS' },
    ...(price != null
      ? {
          offers: {
            '@type': 'Offer',
            price: String(price),
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
          },
        }
      : {}),
  }
}
