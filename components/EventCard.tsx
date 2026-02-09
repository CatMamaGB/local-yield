/**
 * Event / preorder listing card with pickup location and RSVP.
 */

import { formatDate } from "@/lib/utils";
import Link from "next/link";

export interface EventCardProps {
  id: string;
  name: string;
  location: string;
  eventDate: Date | string;
  allowPreorder: boolean;
  producerId?: string;
}

export function EventCard({
  id,
  name,
  location,
  eventDate,
  allowPreorder,
  producerId,
}: EventCardProps) {
  const href = producerId ? `/shop/${producerId}?event=${id}` : "#";
  return (
    <article className="rounded-xl border border-brand/20 bg-white p-4 shadow-sm">
      <Link href={href} className="block">
        <h3 className="font-display text-lg font-semibold text-brand">{name}</h3>
        <p className="mt-1 text-sm text-brand/80">{location}</p>
        <p className="mt-1 text-sm font-medium text-brand">
          {formatDate(typeof eventDate === "string" ? eventDate : eventDate)}
        </p>
        {allowPreorder && (
          <span className="mt-2 inline-block rounded bg-brand-accent/20 px-2 py-0.5 text-xs text-brand-accent">
            Preorder available
          </span>
        )}
      </Link>
    </article>
  );
}
