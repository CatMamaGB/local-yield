/**
 * Dashboard layout: for producers/admins, show tab nav (Customers, Sales Analytics, Orders, Messages)
 * and secondary links (Profile, Products, Events, Records). Buyers see minimal nav.
 * Badges show pending orders, reviews, messages.
 */

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProducerAlertCounts } from "@/lib/dashboard-alerts";
import { DashboardNav } from "./DashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const showProducerTabs =
    user.role === "PRODUCER" || user.role === "ADMIN" || user.isProducer === true;

  let alertCounts = { pendingOrdersCount: 0, pendingReviewsCount: 0, unreadMessagesCount: 0 };
  if (showProducerTabs) {
    alertCounts = await getProducerAlertCounts(user.id);
  }

  return (
    <div className="min-h-screen bg-brand-light">
      {showProducerTabs && (
        <DashboardNav
          pendingOrdersCount={alertCounts.pendingOrdersCount}
          pendingReviewsCount={alertCounts.pendingReviewsCount}
          unreadMessagesCount={alertCounts.unreadMessagesCount}
        />
      )}
      <main>{children}</main>
    </div>
  );
}
