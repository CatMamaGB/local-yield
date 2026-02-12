/**
 * Producer dashboard: upcoming events (markets, pop-ups). Dates, locations, hours.
 * Shown on storefront and in profile.
 */

import { redirect } from "next/navigation";
import { requireProducerOrAdmin } from "@/lib/auth";
import { EventsClient } from "./EventsClient";

export default async function DashboardEventsPage() {
  try {
    await requireProducerOrAdmin();
  } catch {
    redirect("/dashboard");
  }
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-brand">Events</h1>
      <p className="mt-2 text-brand/80">
        Add markets or pop-ups with dates, locations, and hours. They appear on your storefront and in your profile.
      </p>
      <EventsClient />
    </div>
  );
}
