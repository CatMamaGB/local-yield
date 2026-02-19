/**
 * In-app notification center: list + mark as read.
 */

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { NotificationsClient } from "./NotificationsClient";

export default async function DashboardNotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-brand">Notifications</h1>
      <p className="mt-2 text-brand/80">Your in-app notifications.</p>
      <div className="mt-6">
        <NotificationsClient />
      </div>
    </div>
  );
}
