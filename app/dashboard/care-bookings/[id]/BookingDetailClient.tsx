"use client";

/**
 * Booking detail actions: Accept / Decline (caregiver), Cancel (seeker/caregiver), Message.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPatch, apiPost } from "@/lib/client/api-client";
import { ApiError, apiErrorMessage } from "@/lib/client/api-client";
import type { CareBookingStatus } from "@prisma/client";

interface BookingDetailClientProps {
  bookingId: string;
  status: CareBookingStatus;
  isCaregiver: boolean;
  isSeeker: boolean;
}

export function BookingDetailClient({
  bookingId,
  status,
  isCaregiver,
  isSeeker,
}: BookingDetailClientProps) {
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  async function handleStatus(newStatus: CareBookingStatus) {
    setUpdating(true);
    try {
      await apiPatch(`/api/care/bookings/${bookingId}`, { status: newStatus });
      router.refresh();
    } catch (e) {
      alert(e instanceof ApiError ? apiErrorMessage(e) : (e instanceof Error ? e.message : "Failed"));
    } finally {
      setUpdating(false);
    }
  }

  async function handleMessage() {
    try {
      const data = await apiPost<{ conversationId: string }>(`/api/care/bookings/${bookingId}/conversation`, {});
      router.push(`/dashboard/messages?conversationId=${data.conversationId}`);
    } catch (e) {
      alert(e instanceof ApiError ? apiErrorMessage(e) : (e instanceof Error ? e.message : "Failed to open messages"));
    }
  }

  const canAcceptDecline = isCaregiver && status === "REQUESTED";
  const canCancel = (isSeeker || isCaregiver) && (status === "REQUESTED" || status === "ACCEPTED");

  return (
    <>
      {canAcceptDecline && (
        <>
          <button
            type="button"
            onClick={() => handleStatus("ACCEPTED")}
            disabled={updating}
            className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {updating ? "Updating…" : "Accept"}
          </button>
          <button
            type="button"
            onClick={() => handleStatus("DECLINED")}
            disabled={updating}
            className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {updating ? "Updating…" : "Decline"}
          </button>
        </>
      )}
      {canCancel && (
        <button
          type="button"
          onClick={() => handleStatus("CANCELED")}
          disabled={updating}
          className="rounded border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
        >
          {updating ? "Canceling…" : "Cancel booking"}
        </button>
      )}
      <button
        type="button"
        onClick={handleMessage}
        className="rounded border border-brand/30 px-4 py-2 text-sm font-medium text-brand hover:bg-brand-light"
      >
        Message
      </button>
    </>
  );
}
