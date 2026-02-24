/**
 * ProducerHeader — business page header and sections for storefront.
 * Name, bio, optional image, delivery badge; About Us, Story, Upcoming Events, Contact.
 */

import Image from "next/image";
import { DeliveryBadge } from "./DeliveryBadge";

export interface UpcomingEventForDisplay {
  id: string;
  name: string;
  location: string;
  eventDate: string;
  eventHours: string | null;
}

export interface ProducerHeaderProps {
  name: string | null;
  bio: string | null;
  distanceMiles: number | null;
  offersDelivery: boolean;
  deliveryFeeCents: number;
  pickup: boolean;
  /** Business page: optional hero image */
  profileImageUrl?: string | null;
  /** Rich About Us */
  aboutUs?: string | null;
  /** Story */
  story?: string | null;
  /** Upcoming events (date, location, hours) */
  upcomingEvents?: UpcomingEventForDisplay[];
  /** Shown only when producer allows (not in-app only) */
  contactEmail?: string | null;
  generalLocation?: string | null;
  availabilityHours?: string | null;
}

export function ProducerHeader({
  name,
  bio,
  distanceMiles,
  offersDelivery,
  deliveryFeeCents,
  pickup,
  profileImageUrl,
  aboutUs,
  story,
  upcomingEvents = [],
  contactEmail,
  generalLocation,
  availabilityHours,
}: ProducerHeaderProps) {
  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-brand/20 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap gap-6">
          {profileImageUrl && (
            <Image
              src={profileImageUrl}
              alt={name || "Producer"}
              width={128}
              height={128}
              className="h-32 w-32 shrink-0 rounded-lg border border-brand/20 object-cover"
              unoptimized
            />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-semibold text-brand">
              {name || "Producer"}
            </h1>
            {bio && <p className="mt-2 text-brand/80">{bio}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {distanceMiles != null && (
                <span className="rounded bg-brand-light px-2 py-1 text-sm text-brand">
                  ~{distanceMiles} mi away
                </span>
              )}
              <DeliveryBadge delivery={offersDelivery && deliveryFeeCents >= 0} pickup={pickup} />
              {offersDelivery && deliveryFeeCents > 0 && (
                <span className="text-sm text-brand/70">
                  Delivery fee: ${(deliveryFeeCents / 100).toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {aboutUs && (
        <section className="rounded-xl border border-brand/20 bg-white p-6 shadow-sm" aria-labelledby="about-heading">
          <h2 id="about-heading" className="font-display text-lg font-semibold text-brand">
            About Us
          </h2>
          <div className="mt-3 whitespace-pre-wrap text-brand/90">{aboutUs}</div>
        </section>
      )}

      {story && (
        <section className="rounded-xl border border-brand/20 bg-white p-6 shadow-sm" aria-labelledby="story-heading">
          <h2 id="story-heading" className="font-display text-lg font-semibold text-brand">
            Our Story
          </h2>
          <div className="mt-3 whitespace-pre-wrap text-brand/90">{story}</div>
        </section>
      )}

      {upcomingEvents.length > 0 && (
        <section className="rounded-xl border border-brand/20 bg-white p-6 shadow-sm" aria-labelledby="events-heading">
          <h2 id="events-heading" className="font-display text-lg font-semibold text-brand">
            Upcoming Events
          </h2>
          <ul className="mt-4 space-y-3">
            {upcomingEvents.map((e) => (
              <li key={e.id} className="rounded-lg border border-brand/10 bg-brand-light/30 p-3 text-sm">
                <span className="font-medium text-brand">{e.name}</span>
                <span className="text-brand/70"> · {e.location}</span>
                <span className="text-brand/70">
                  {" "}
                  {new Date(e.eventDate).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                {e.eventHours && (
                  <span className="text-brand/70"> · {e.eventHours}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(contactEmail || generalLocation || availabilityHours) && (
        <section className="rounded-xl border border-brand/20 bg-white p-6 shadow-sm" aria-labelledby="contact-heading">
          <h2 id="contact-heading" className="font-display text-lg font-semibold text-brand">
            Contact
          </h2>
          <ul className="mt-3 space-y-1 text-brand/90">
            {contactEmail && (
              <li>
                <a href={`mailto:${contactEmail}`} className="text-brand-accent hover:underline">
                  {contactEmail}
                </a>
              </li>
            )}
            {generalLocation && <li>{generalLocation}</li>}
            {availabilityHours && <li>Hours: {availabilityHours}</li>}
          </ul>
        </section>
      )}
    </div>
  );
}
