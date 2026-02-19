/**
 * Privacy sanitizer for telemetry events.
 * Enforces allow list and forbids PII fields to prevent accidental data leakage.
 */

import type { TelemetryEvent } from "./events";

/**
 * Allowed fields per event type. Unknown fields are stripped.
 */
const ALLOWED_FIELDS_BY_EVENT: Record<string, Set<string>> = {
  care_search_submitted: new Set(["event", "zipPrefix", "radius", "category", "resultCount"]),
  care_profile_viewed: new Set(["event", "caregiverId", "viewerId"]),
  care_booking_started: new Set(["event", "caregiverId", "seekerId"]),
  care_booking_submitted: new Set(["event", "bookingId", "caregiverId", "seekerId"]),
  onboarding_started: new Set(["event", "from"]),
  onboarding_completed: new Set(["event", "primaryMode", "hasZip", "rolesCount"]),
  signup_completed: new Set(["event", "primaryMode", "hasProducer", "hasCaregiver", "hasCareSeeker"]),
};

/**
 * Fields that are never allowed in telemetry (PII and sensitive data).
 */
const FORBIDDEN_FIELDS = new Set([
  "email",
  "zip", // Use zipPrefix instead
  "phone",
  "name",
  "address",
  "addressLine1",
  "city",
  "state",
  "notes",
  "description",
  "bio",
]);

/**
 * Sanitize a telemetry event by:
 * - Stripping unknown keys (not in allow list for event type)
 * - Forbidding PII fields
 * - Returning sanitized event
 */
export function sanitizeTelemetryEvent(event: TelemetryEvent): TelemetryEvent {
  const eventType = event.event;
  const allowedFields = ALLOWED_FIELDS_BY_EVENT[eventType];
  
  if (!allowedFields) {
    // Unknown event type - strip all fields except event
    return { event: eventType } as TelemetryEvent;
  }

  const sanitized: Record<string, unknown> = { event: eventType };

  for (const [key, value] of Object.entries(event)) {
    // Skip if field is forbidden
    if (FORBIDDEN_FIELDS.has(key)) {
      continue;
    }
    // Skip if field not in allow list
    if (!allowedFields.has(key)) {
      continue;
    }
    sanitized[key] = value;
  }

  return sanitized as unknown as TelemetryEvent;
}
