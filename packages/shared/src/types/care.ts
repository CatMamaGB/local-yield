/**
 * Care listing types (planning). Not live until NEXT_PUBLIC_ENABLE_CARE=true.
 *
 * Market = Product (see prisma/schema.prisma).
 * Care = ServiceListing (separate table when we build Care).
 *
 * Keep two tables; share: Users, Messaging (future), Reviews/issue resolution, Location.
 */

/** Future: service/booking listing for Care (caregivers). Do not merge with Product. */
export interface ServiceListingPlanned {
  id: string;
  userId: string; // caregiver
  title: string;
  description: string;
  // rate, availability, service type, etc.
}
