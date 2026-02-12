"use client";

/**
 * Events list + add form. Producer can add dates, locations, hours for markets/pop-ups.
 */

import { useState, useEffect } from "react";

interface EventRow {
  id: string;
  name: string;
  location: string;
  eventDate: string;
  eventHours: string | null;
  allowPreorder?: boolean;
}

export function EventsClient() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventHours, setEventHours] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    fetch("/api/dashboard/events")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setEvents(data.events ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !location.trim() || !eventDate) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          location: location.trim(),
          eventDate,
          eventHours: eventHours.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add");
      setShowAdd(false);
      setName("");
      setLocation("");
      setEventDate("");
      setEventHours("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this event?")) return;
    try {
      const res = await fetch(`/api/dashboard/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  if (loading) return <p className="mt-6 text-brand/70">Loading events…</p>;
  if (error) return <p className="mt-6 text-red-600">{error}</p>;

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          className="rounded bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90"
        >
          {showAdd ? "Cancel" : "Add event"}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="rounded-xl border border-brand/20 bg-white p-6">
          <h3 className="font-display font-semibold text-brand">New event</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-brand">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Saturday Market"
                className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Main St & 5th Ave"
                className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand">Date</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand">Hours (optional)</label>
              <input
                type="text"
                value={eventHours}
                onChange={(e) => setEventHours(e.target.value)}
                placeholder="e.g. 9am–2pm"
                className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="mt-4 rounded bg-brand px-4 py-2 text-sm text-white hover:bg-brand/90 disabled:opacity-50"
          >
            {submitting ? "Adding…" : "Add event"}
          </button>
        </form>
      )}

      {events.length === 0 ? (
        <p className="rounded-xl border border-brand/20 bg-white p-6 text-brand/70">
          No events yet. Add markets or pop-ups to show them on your storefront.
        </p>
      ) : (
        <ul className="space-y-3">
          {events.map((e) => (
            <li
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand/20 bg-white p-4"
            >
              <div>
                <p className="font-medium text-brand">{e.name}</p>
                <p className="text-sm text-brand/70">
                  {e.location} · {new Date(e.eventDate).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                  {e.eventHours && ` · ${e.eventHours}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(e.id)}
                className="rounded border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
