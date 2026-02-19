/**
 * Care booking detail page: full booking info and actions (Accept/Decline/Message/Cancel).
 */

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getBookingByIdForUser } from "@/lib/care";
import { SERVICE_TYPE_LABELS, SPECIES_LABELS } from "@/lib/care/labels";
import { BookingDetailClient } from "./BookingDetailClient";

export default async function CareBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const { id } = await params;
  const booking = await getBookingByIdForUser(id, user.id, user.role === "ADMIN");
  if (!booking) notFound();

  const isCaregiver = booking.caregiverId === user.id;
  const isSeeker = booking.careSeekerId === user.id;
  const other = isCaregiver ? booking.careSeeker : booking.caregiver;

  const statusLabels: Record<string, string> = {
    REQUESTED: "Requested",
    ACCEPTED: "Accepted",
    DECLINED: "Declined",
    CANCELED: "Canceled",
    COMPLETED: "Completed",
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/dashboard/care-bookings" className="text-brand-accent hover:underline text-sm">
        ← Back to bookings
      </Link>
      <div className="mt-4 rounded-xl border border-brand/20 bg-white p-6 shadow-sm">
        <h1 className="font-display text-xl font-semibold text-brand">Booking details</h1>
        <p className="mt-1 text-sm text-brand/70">
          {isCaregiver ? `Request from ${other.name ?? "Care seeker"}` : `Booking with ${other.name ?? "Helper"}`}
        </p>
        <div className="mt-4">
          <span className="rounded px-2 py-1 text-sm font-medium bg-brand/10 text-brand">
            {statusLabels[booking.status] ?? booking.status}
          </span>
        </div>
        <dl className="mt-6 space-y-2 text-sm">
          <div>
            <dt className="font-medium text-brand/80">Dates</dt>
            <dd className="text-brand">
              {new Date(booking.startAt).toLocaleDateString()} – {new Date(booking.endAt).toLocaleDateString()}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-brand/80">Location (ZIP)</dt>
            <dd className="text-brand">{booking.locationZip}</dd>
          </div>
          {booking.species && (
            <div>
              <dt className="font-medium text-brand/80">Species</dt>
              <dd className="text-brand">{SPECIES_LABELS[booking.species] ?? booking.species}</dd>
            </div>
          )}
          {booking.serviceType && (
            <div>
              <dt className="font-medium text-brand/80">Service</dt>
              <dd className="text-brand">{SERVICE_TYPE_LABELS[booking.serviceType] ?? booking.serviceType}</dd>
            </div>
          )}
          {booking.notes && (
            <div>
              <dt className="font-medium text-brand/80">Notes</dt>
              <dd className="text-brand">{booking.notes}</dd>
            </div>
          )}
        </dl>
        <div className="mt-6 flex flex-wrap gap-3 border-t border-brand/10 pt-4">
          <BookingDetailClient
            bookingId={booking.id}
            status={booking.status}
            isCaregiver={isCaregiver}
            isSeeker={isSeeker}
          />
        </div>
      </div>
    </div>
  );
}
