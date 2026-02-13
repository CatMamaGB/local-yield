/**
 * Dashboard: Care bookings page.
 * Shows bookings relevant to current user (as seeker and/or caregiver).
 * Actions: caregiver can Accept/Decline, seeker can Cancel.
 */

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBookingsForUser } from "@/lib/care";
import { PageHeader } from "@/components/ui/PageHeader";
import { CareBookingsClient } from "./CareBookingsClient";
import type { CareBookingStatus, AnimalSpecies, CareServiceType } from "@prisma/client";

export default async function CareBookingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const bookings = await getBookingsForUser(user.id);

  // Transform for client component
  const bookingRows = bookings.map((b) => ({
    id: b.id,
    status: b.status,
    startAt: b.startAt.toISOString(),
    endAt: b.endAt.toISOString(),
    locationZip: b.locationZip,
    notes: b.notes,
    species: b.species,
    serviceType: b.serviceType,
    careSeeker: {
      id: b.careSeeker.id,
      name: b.careSeeker.name,
      zipCode: b.careSeeker.zipCode,
    },
    caregiver: {
      id: b.caregiver.id,
      name: b.caregiver.name,
      zipCode: b.caregiver.zipCode,
    },
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageHeader
        title="Care bookings"
        subtitle="Manage your care requests and bookings. Accept or decline requests as a caregiver, or cancel as a seeker."
      />
      <div className="mt-6">
        <CareBookingsClient bookings={bookingRows} currentUserId={user.id} />
      </div>
    </div>
  );
}
