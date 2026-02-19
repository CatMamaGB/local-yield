/**
 * Geo constants: radius options and types.
 */

export const MAX_RADIUS_MILES = 150;

export const RADIUS_OPTIONS = [5, 10, 25, 50, 100, 150] as const;
export type RadiusOption = (typeof RADIUS_OPTIONS)[number];
