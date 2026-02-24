"use client";

/**
 * Client component for care bookings with accept/decline/cancel actions.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SERVICE_TYPE_LABELS, SPECIES_LABELS } from "@/lib/care/labels";
import type { CareBookingStatus, AnimalSpecies, CareServiceType } from "@prisma/client";
import { apiPatch, apiPost } from "@/lib/client/api-client";
import { ApiError, apiErrorMessage } from "@/lib/client/api-client";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { EmptyState } from "@/components/ui/EmptyState";

interface BookingRow {
  id: string;
  status: CareBookingStatus;
  startAt: string;
  endAt: string;
  locationZip: string;
  notes: string | null;
  species: AnimalSpecies | null;
  serviceType: CareServiceType | null;
  careSeeker: { id: string; name: string | null; zipCode: string | null };
  caregiver: { id: string; name: string | null; zipCode: string | null };
  createdAt: string;
  updatedAt: string;
}

interface CareBookingsClientProps {
  bookings: BookingRow[];
  currentUserId: string;
}

// UI labels for status (species/serviceType from @/lib/care/labels)
const LABELS = {
  status: {
    REQUESTED: "Requested",
    ACCEPTED: "Accepted",
    DECLINED: "Declined",
    CANCELED: "Canceled",
    COMPLETED: "Completed",
  },
} as const;

function getStatusColor(status: CareBookingStatus): string {
  switch (status) {
    case "REQUESTED":
      return "bg-yellow-100 text-yellow-800";
    case "ACCEPTED":
      return "bg-green-100 text-green-800";
    case "DECLINED":
      return "bg-red-100 text-red-800";
    case "CANCELED":
      return "bg-gray-100 text-gray-800";
    case "COMPLETED":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function CareBookingsClient({ bookings, currentUserId }: CareBookingsClientProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleStatusUpdate(bookingId: string, newStatus: CareBookingStatus) {
    setUpdating(bookingId);
    setError(null);

    try {
      await apiPatch(`/api/care/bookings/${bookingId}`, { status: newStatus });
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? apiErrorMessage(err) : (err instanceof Error ? err.message : "Failed to update"));
      setUpdating(null);
    }
  }

  async function handleMessage(bookingId: string) {
    try {
      const data = await apiPost<{ conversationId: string }>(`/api/care/bookings/${bookingId}/conversation`);
      router.push(`/dashboard/messages?conversationId=${data.conversationId}`);
    } catch (err) {
      setError(err instanceof ApiError ? apiErrorMessage(err) : (err instanceof Error ? err.message : "Failed to open messages"));
    }
  }

  if (bookings.length === 0) {
    return (
      <EmptyState
        title="No bookings yet"
        action={{ label: "Browse helpers", href: "/care/browse" }}
        className="rounded-xl border border-brand/20"
      />
    );
  }

  // Separate bookings by role
  const asCaregiver = bookings.filter((b) => b.caregiver.id === currentUserId);
  const asSeeker = bookings.filter((b) => b.careSeeker.id === currentUserId);

  return (
    <div className="space-y-8">
      {error && (
        <InlineAlert variant="error" className="mb-4">{error}</InlineAlert>
      )}

      {/* As caregiver */}
      {asCaregiver.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold text-brand mb-4">
            Requests & bookings ({asCaregiver.length})
          </h2>
          <div className="space-y-4">
            {asCaregiver.map((booking) => {
              const isUpdating = updating === booking.id;
              const canAccept = booking.status === "REQUESTED";
              const canDecline = booking.status === "REQUESTED";

              return (
                <div
                  key={booking.id}
                  className="rounded-xl border border-brand/20 bg-white p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <Link href={`/dashboard/care-bookings/${booking.id}`} className="font-semibold text-brand hover:underline">
                        Request from {booking.careSeeker.name || "Care seeker"}
                      </Link>
                      <p className="text-sm text-brand/70 mt-1">
                        {new Date(booking.startAt).toLocaleDateString()} - {new Date(booking.endAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`rounded px-2 py-1 text-xs font-medium ${getStatusColor(booking.status)}`}
                    >
                      {LABELS.status[booking.status]}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-brand/80">
                    <p>
                      <span className="font-medium">Location:</span> {booking.locationZip}
                    </p>
                    {booking.species && (
                      <p>
                        <span className="font-medium">Species:</span>{" "}
                        {booking.species ? SPECIES_LABELS[booking.species] : booking.species}
                      </p>
                    )}
                    {booking.serviceType && (
                      <p>
                        <span className="font-medium">Service:</span>{" "}
                        {booking.serviceType ? SERVICE_TYPE_LABELS[booking.serviceType] : booking.serviceType}
                      </p>
                    )}
                    {booking.notes && (
                      <p>
                        <span className="font-medium">Notes:</span> {booking.notes}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    {canAccept && (
                      <button
                        onClick={() => handleStatusUpdate(booking.id, "ACCEPTED")}
                        disabled={isUpdating}
                        className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {isUpdating ? "Updating..." : "Accept"}
                      </button>
                    )}
                    {canDecline && (
                      <button
                        onClick={() => handleStatusUpdate(booking.id, "DECLINED")}
                        disabled={isUpdating}
                        className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {isUpdating ? "Updating..." : "Decline"}
                      </button>
                    )}
                    <button
                      onClick={() => handleMessage(booking.id)}
                      className="rounded border border-brand/30 px-4 py-2 text-sm font-medium text-brand hover:bg-brand-light"
                    >
                      Message
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* As seeker */}
      {asSeeker.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold text-brand mb-4">
            Your requests ({asSeeker.length})
          </h2>
          <div className="space-y-4">
            {asSeeker.map((booking) => {
              const isUpdating = updating === booking.id;
              const canCancel =
                booking.status === "REQUESTED" || booking.status === "ACCEPTED";

              return (
                <div
                  key={booking.id}
                  className="rounded-xl border border-brand/20 bg-white p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <Link href={`/dashboard/care-bookings/${booking.id}`} className="font-semibold text-brand hover:underline">
                        Booking with {booking.caregiver.name || "Helper"}
                      </Link>
                      <p className="text-sm text-brand/70 mt-1">
                        {new Date(booking.startAt).toLocaleDateString()} - {new Date(booking.endAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`rounded px-2 py-1 text-xs font-medium ${getStatusColor(booking.status)}`}
                    >
                      {LABELS.status[booking.status]}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-brand/80">
                    <p>
                      <span className="font-medium">Location:</span> {booking.locationZip}
                    </p>
                    {booking.species && (
                      <p>
                        <span className="font-medium">Species:</span>{" "}
                        {booking.species ? SPECIES_LABELS[booking.species] : booking.species}
                      </p>
                    )}
                    {booking.serviceType && (
                      <p>
                        <span className="font-medium">Service:</span>{" "}
                        {booking.serviceType ? SERVICE_TYPE_LABELS[booking.serviceType] : booking.serviceType}
                      </p>
                    )}
                    {booking.notes && (
                      <p>
                        <span className="font-medium">Notes:</span> {booking.notes}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    {canCancel && (
                      <button
                        onClick={() => handleStatusUpdate(booking.id, "CANCELED")}
                        disabled={isUpdating}
                        className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {isUpdating ? "Canceling..." : "Cancel"}
                      </button>
                    )}
                    <button
                      onClick={() => handleMessage(booking.id)}
                      className="rounded border border-brand/30 px-4 py-2 text-sm font-medium text-brand hover:bg-brand-light"
                    >
                      Message
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
