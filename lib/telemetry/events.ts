/**
 * Telemetry event type definitions.
 * All events must conform to these shapes for type safety and privacy compliance.
 */

export interface CareSearchSubmittedEvent {
  event: "care_search_submitted";
  zipPrefix: string;
  radius: number;
  category?: string;
  resultCount: number;
}

export interface CareProfileViewedEvent {
  event: "care_profile_viewed";
  caregiverId: string;
  viewerId?: string; // if authenticated
}

export interface CareBookingStartedEvent {
  event: "care_booking_started";
  caregiverId: string;
  seekerId?: string;
}

export interface CareBookingSubmittedEvent {
  event: "care_booking_submitted";
  bookingId: string;
  caregiverId: string;
  seekerId: string;
}

export interface CareBookingAcceptedEvent {
  event: "care_booking_accepted";
  bookingId: string;
  caregiverId: string;
  seekerId: string;
}

export interface CareBookingDeclinedEvent {
  event: "care_booking_declined";
  bookingId: string;
  caregiverId: string;
  seekerId: string;
}

export interface CareBookingCanceledEvent {
  event: "care_booking_canceled";
  bookingId: string;
  caregiverId: string;
  seekerId: string;
  canceledBy: "seeker" | "caregiver";
}

export interface CareBookingCompletedEvent {
  event: "care_booking_completed";
  bookingId: string;
  caregiverId: string;
  seekerId: string;
}

/** Funnel: user landed on onboarding (from=login|signup or direct). */
export interface OnboardingStartedEvent {
  event: "onboarding_started";
  from?: "login" | "signup";
}

/** Funnel: user completed onboarding (terms + optional ZIP/roles). */
export interface OnboardingCompletedEvent {
  event: "onboarding_completed";
  primaryMode: "MARKET" | "SELL" | "CARE";
  hasZip: boolean;
  rolesCount: number; // number of roles selected (excluding BUYER)
}

/** Funnel: signup completed (before onboarding). Modes selected at signup. */
export interface SignupCompletedEvent {
  event: "signup_completed";
  primaryMode: "MARKET" | "SELL" | "CARE";
  hasProducer: boolean;
  hasCaregiver: boolean;
  hasCareSeeker: boolean;
}

export type TelemetryEvent =
  | CareSearchSubmittedEvent
  | CareProfileViewedEvent
  | CareBookingStartedEvent
  | CareBookingSubmittedEvent
  | CareBookingAcceptedEvent
  | CareBookingDeclinedEvent
  | CareBookingCanceledEvent
  | CareBookingCompletedEvent
  | OnboardingStartedEvent
  | OnboardingCompletedEvent
  | SignupCompletedEvent;
