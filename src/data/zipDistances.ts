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

  // Outer metro / edge of service area
  '39066': 18, // Terry
  '39154': 20, // Raymond
  '39288': 25, // Pelahatchie
  '39073': 25, // Crystal Springs
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
