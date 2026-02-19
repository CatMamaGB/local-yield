"use client";

/**
 * Booking form for requesting care from a caregiver.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ZipCodeInput } from "@/components/ZipCodeInput";
import { SERVICE_TYPE_LABELS, SPECIES_LABELS } from "@/lib/care/labels";
import { logTelemetry } from "@/lib/telemetry/telemetry";
import type { CareBookingStartedEvent } from "@/lib/telemetry/events";
import type { AnimalSpecies, CareServiceType } from "@prisma/client";
import { apiPost } from "@/lib/client/api-client";
import { ApiError, apiErrorMessage } from "@/lib/client/api-client";
import { InlineAlert } from "@/components/ui/InlineAlert";

interface BookingFormProps {
  caregiverId: string;
}

export function BookingForm({ caregiverId }: BookingFormProps) {
  const router = useRouter();
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [locationZip, setLocationZip] = useState("");
  const [species, setSpecies] = useState<AnimalSpecies | "">("");
  const [serviceType, setServiceType] = useState<CareServiceType | "">("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Log booking started event on mount
  useEffect(() => {
    const event: CareBookingStartedEvent = {
      event: "care_booking_started",
      caregiverId,
    };
    logTelemetry(event);
  }, [caregiverId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!startDate || !endDate || !locationZip || locationZip.trim().length !== 5) {
      setError("Please fill in all required fields");
      return;
    }

    // Combine date and time
    const startAt = new Date(`${startDate}T${startTime || "00:00"}`);
    const endAt = new Date(`${endDate}T${endTime || "23:59"}`);

    if (endAt <= startAt) {
      setError("End date/time must be after start date/time");
      return;
    }

    setSubmitting(true);

    try {
      const data = await apiPost<{ bookingId: string; conversationId: string }>("/api/care/bookings", {
        caregiverId,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        locationZip: locationZip.trim(),
        notes: notes.trim() || undefined,
        species: species || undefined,
        serviceType: serviceType || undefined,
      });
      router.push(`/dashboard/messages?conversationId=${data.conversationId}`);
    } catch (err) {
      setError(err instanceof ApiError ? apiErrorMessage(err) : (err instanceof Error ? err.message : "Failed to request booking"));
    } finally {
      setSubmitting(false);
    }
  }

  // Set minimum date to today
  const today = new Date().toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h3 className="font-display text-lg font-semibold text-brand leading-tight">Request booking</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="start-date" className="block text-sm font-medium text-brand mb-1.5">
            Start date <span className="text-brand-terracotta" aria-hidden>*</span>
          </label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={today}
            required
            className="w-full rounded-lg border border-brand/20 px-3 py-2 text-brand focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
          />
        </div>
        <div>
          <label htmlFor="start-time" className="block text-sm font-medium text-brand mb-1.5">
            Start time (optional)
          </label>
          <input
            id="start-time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full rounded-lg border border-brand/20 px-3 py-2 text-brand focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
          />
        </div>
        <div>
          <label htmlFor="end-date" className="block text-sm font-medium text-brand mb-1.5">
            End date <span className="text-brand-terracotta" aria-hidden>*</span>
          </label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate || today}
            required
            className="w-full rounded-lg border border-brand/20 px-3 py-2 text-brand focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
          />
        </div>
        <div>
          <label htmlFor="end-time" className="block text-sm font-medium text-brand mb-1.5">
            End time (optional)
          </label>
          <input
            id="end-time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full rounded-lg border border-brand/20 px-3 py-2 text-brand focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
          />
        </div>
      </div>

      <ZipCodeInput
        value={locationZip}
        onChange={setLocationZip}
        placeholder="Where will care be provided?"
        required
        aria-label="Location ZIP code"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="species" className="block text-sm font-medium text-brand mb-1.5">
            Species (optional)
          </label>
          <select
            id="species"
            value={species}
            onChange={(e) => setSpecies(e.target.value as AnimalSpecies | "")}
            className="w-full rounded-lg border border-brand/20 px-3 py-2 text-brand focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
          >
            <option value="">Select species</option>
            {Object.entries(SPECIES_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="service-type" className="block text-sm font-medium text-brand mb-1.5">
            Service type (optional)
          </label>
          <select
            id="service-type"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value as CareServiceType | "")}
            className="w-full rounded-lg border border-brand/20 px-3 py-2 text-brand focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
          >
            <option value="">Select service</option>
            {Object.entries(SERVICE_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-brand mb-1.5">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Any special instructions or details..."
          className="w-full min-h-[100px] rounded-lg border border-brand/20 px-3 py-2 text-brand placeholder:text-brand/50 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
        />
      </div>

      {error && (
        <InlineAlert variant="error">{error}</InlineAlert>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-brand-accent px-4 py-2.5 text-sm font-medium text-white shadow-farmhouse transition hover:bg-brand-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 disabled:opacity-50"
      >
        {submitting ? "Requesting..." : "Request booking"}
      </button>
    </form>
  );
}
