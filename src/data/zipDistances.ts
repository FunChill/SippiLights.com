/**
 * Static ZIP-prefix → approximate-miles-from-39211 lookup for the Jackson, MS
 * metro. These are rough straight-line estimates for quoting delivery zones
 * at checkout, NOT precise driving distances. Exact geocoding (e.g. a
 * Google/Mapbox Distance Matrix call) is a later upgrade — swap
 * `estimateDistanceMiles` for a real API call when that's ready, keeping the
 * same return shape so callers don't need to change.
 */

export const ZIP_DISTANCES: Record<string, number> = {
  // Jackson proper
  '39201': 5,
  '39202': 4,
  '39203': 6,
  '39204': 7,
  '39206': 3,
  '39209': 8,
  '39211': 0,
  '39212': 9,
  '39213': 4,
  '39216': 3,
  '39217': 6,

  // Ridgeland
  '39157': 10,

  // Madison
  '39110': 15,

  // Flowood / Pearl
  '39232': 10,
  '39208': 12,

  // Byram
  '39218': 12,
  '39272': 13,

  // Clinton
  '39056': 12,
  '39060': 13,

  // Brandon
  '39042': 15,
  '39047': 16,

  // Outer metro
  '39066': 18, // Terry
  '39154': 20, // Raymond
  '39073': 18, // Florence (was mislabeled Crystal Springs)
  '39288': 12, // Pearl (PO box ZIP; was mislabeled Pelahatchie)
  '39145': 25, // Pelahatchie

  // 26-50 miles: delivery allowed with a 2-marquee minimum and a flat
  // travel fee. Verified against Walt's actual service area.
  '39046': 28, // Canton
  '39071': 27, // Flora
  '39059': 30, // Crystal Springs
  '39175': 30, // Utica
  '39151': 30, // Puckett
  '39044': 32, // Braxton
  '39040': 35, // Bentonia
  '39114': 35, // Mendenhall
  '39117': 38, // Morton
  '39083': 40, // Hazlehurst
  '39094': 40, // Lena
  '39146': 40, // Pickens
  '39045': 42, // Camden
  '39051': 45, // Carthage
  '39074': 45, // Forest
  '39111': 45, // Magee
  '39180': 45, // Vicksburg
  '39194': 48, // Yazoo City

  // Beyond 50 miles: NOT bookable online. Listed deliberately rather than
  // left absent — an absent ZIP reads as "unknown, we'll confirm", which is
  // vaguer than these deserve. Naming them lets the site (and the Phase 10
  // reply drafter) say plainly that it's outside the service area instead of
  // implying a quote might follow.
  '39601': 55, // Brookhaven
  '39090': 65, // Kosciusko
  '39648': 75, // McComb
  '39350': 80, // Philadelphia
  '39440': 85, // Laurel
  '39401': 90, // Hattiesburg
  '39301': 95, // Meridian
  '38930': 95, // Greenwood
  '39120': 110, // Natchez
  '39759': 110, // Starkville
  '38701': 115, // Greenville
  '39701': 120, // Columbus
  '38801': 150, // Tupelo
  '38655': 150, // Oxford
  '39501': 160, // Gulfport
  '39530': 165, // Biloxi
  '39567': 175, // Pascagoula
}

/**
 * Approximate miles from the Jackson home base (39211) for a given ZIP.
 * Returns null for ZIPs not in the table — callers should treat that as
 * "unknown, confirm manually" rather than assuming in- or out-of-area.
 */
export function estimateDistanceMiles(zip: string): number | null {
  const normalized = zip.trim().slice(0, 5)
  return ZIP_DISTANCES[normalized] ?? null
}
