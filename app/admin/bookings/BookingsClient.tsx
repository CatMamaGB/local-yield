"use client";

/**
 * Admin bookings list client component.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/client/api-client";
import { ApiError, apiErrorMessage } from "@/lib/client/api-client";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

interface Booking {
  id: string;
  status: string;
  startAt: string;
  endAt: string;
  createdAt: string;
  careSeeker: {
    id: string;
    name: string | null;
    email: string;
  };
  caregiver: {
    id: string;
    name: string | null;
    email: string;
  };
}

export function BookingsClient() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  async function fetchBookings() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      params.append("limit", "100");

      const data = await apiGet<{ bookings: Booking[] }>(`/api/admin/bookings?${params.toString()}`);
      setBookings(data.bookings);
    } catch (err) {
      setError(err instanceof ApiError ? apiErrorMessage(err) : (err instanceof Error ? err.message : "Failed to load bookings"));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingSkeleton rows={10} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label htmlFor="status-filter" className="text-sm font-medium text-brand">
          Filter by status:
        </label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-brand/20 px-3 py-2 text-brand focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
        >
          <option value="">All</option>
          <option value="REQUESTED">Requested</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="DECLINED">Declined</option>
          <option value="CANCELED">Canceled</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {error && <InlineAlert variant="error">{error}</InlineAlert>}

      {bookings.length === 0 ? (
        <p className="text-brand/80">No bookings found.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-brand/10 bg-white shadow-farmhouse">
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand/10 bg-brand-light/40">
                <th className="py-3 pl-4 text-left font-display font-semibold text-brand">Seeker</th>
                <th className="py-3 text-left font-display font-semibold text-brand">Caregiver</th>
                <th className="py-3 text-left font-display font-semibold text-brand">Dates</th>
                <th className="py-3 text-left font-display font-semibold text-brand">Status</th>
                <th className="py-3 text-left font-display font-semibold text-brand">Created</th>
                <th className="py-3 pr-4 text-left font-display font-semibold text-brand">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-b border-brand/10">
                  <td className="py-3 pl-4">
                    <div className="text-sm text-brand">{booking.careSeeker.name || booking.careSeeker.email}</div>
                  </td>
                  <td className="py-3">
                    <div className="text-sm text-brand">{booking.caregiver.name || booking.caregiver.email}</div>
                  </td>
                  <td className="py-3">
                    <div className="text-sm text-brand/80">
                      {new Date(booking.startAt).toLocaleDateString()} - {new Date(booking.endAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-brand-light text-brand">
                      {booking.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="text-sm text-brand/80">
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <Link
                      href={`/dashboard/care-bookings`}
                      className="text-xs text-brand-accent hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
