/**
 * ZIP-to-coordinates and distance (Haversine) for The Local Yield.
 * Uses zipcodes package (US ZIPs). Run server-side only (API routes).
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const zipcodes = require("zipcodes") as {
  lookup: (zip: string | number) => { latitude: number; longitude: number } | undefined;
  distance: (zipA: string | number, zipB: string | number) => number | null;
};

/** Normalize ZIP to 5-digit string for lookup. */
function normalizeZip(zip: string): string {
  const s = String(zip).trim().slice(0, 5);
  return s.length === 5 ? s : "";
}

/** Get coordinates for a US ZIP, or null if not found. */
export function getZipCoordinates(zip: string): { lat: number; lng: number } | null {
  const normalized = normalizeZip(zip);
  if (!normalized) return null;
  const loc = zipcodes.lookup(normalized);
  if (!loc?.latitude || !loc?.longitude) return null;
  return { lat: loc.latitude, lng: loc.longitude };
}

/** Haversine distance in miles between two points. */
export function haversineMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3958.76; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Distance in miles between two ZIPs. Returns null if either ZIP is unknown. */
export function getDistanceBetweenZips(zipA: string, zipB: string): number | null {
  const na = normalizeZip(zipA);
  const nb = normalizeZip(zipB);
  if (!na || !nb) return null;
  const d = zipcodes.distance(na, nb);
  return d == null ? null : Math.round(d * 10) / 10; // one decimal
}

/** Check if a listing ZIP is within radius (miles) of user ZIP. */
export function isWithinRadius(
  userZip: string,
  listingZip: string,
  radiusMiles: number
): boolean {
  const d = getDistanceBetweenZips(userZip, listingZip);
  return d != null && d <= radiusMiles;
}

/**
 * Shared discovery: filter and sort entities by ZIP + radius.
 * Powers Market (listings) and Care (caregiver proximity). Build once, reuse.
 * @param userZip - Viewer's ZIP
 * @param radiusMiles - Max distance in miles
 * @param items - Items with at least zipCode (e.g. { zipCode: string, ... })
 * @returns Items with distance and nearby flag, sorted: nearby first, then by distance
 */
export function filterByZipAndRadius<T extends { zipCode: string }>(
  userZip: string,
  radiusMiles: number,
  items: T[]
): Array<T & { distance: number | null; nearby: boolean }> {
  const withDistance = items.map((item) => {
    const distance = userZip && item.zipCode ? getDistanceBetweenZips(userZip, item.zipCode) : null;
    const nearby = distance != null && distance <= radiusMiles;
    return { ...item, distance, nearby };
  });
  return withDistance.sort((a, b) => {
    const da = a.distance ?? 9999;
    const db = b.distance ?? 9999;
    if (a.nearby !== b.nearby) return a.nearby ? -1 : 1;
    return da - db;
  });
}
