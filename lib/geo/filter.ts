/**
 * Radius filtering utilities for ZIP-based discovery.
 * Powers Market (listings) and Care (caregiver proximity). Build once, reuse.
 */

import { getDistanceBetweenZips } from "./distance";

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
