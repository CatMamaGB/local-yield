/**
 * Producer dashboard: upcoming events (markets, pop-ups). Dates, locations, hours.
 * Shown on storefront and in profile.
 */

import { redirect } from "next/navigation";
import { requireProducerOrAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { EventsClient } from "./EventsClient";

export default async function DashboardEventsPage() {
  try {
    await requireProducerOrAdmin();
  } catch {
    redirect("/dashboard");
  }
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageHeader
        title="Events"
        subtitle="Add markets or pop-ups with dates, locations, and hours. They appear on your storefront and in your profile."
      />
      <EventsClient />
    </div>
  );
}
