/**
 * Dashboard layout: for producers/admins, show DashboardNav; otherwise BuyerDashboardNav.
 * Single source of truth: getUserCapabilities(user).canSell.
 */

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserCapabilities } from "@/lib/authz";
import { getProducerAlertCounts } from "@/lib/dashboard-alerts";
import { DashboardNav } from "./DashboardNav";
import { BuyerDashboardNav } from "./BuyerDashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const { canSell, canCare, canAdmin } = getUserCapabilities(user);
  
  // Admins should use the admin section, not the producer dashboard
  if (canAdmin) {
    redirect("/admin");
  }
  
  const showProducerTabs = canSell;
  const showCareBookings = canCare;

  let alertCounts = { pendingOrdersCount: 0, pendingReviewsCount: 0, unreadMessagesCount: 0 };
  if (showProducerTabs) {
    alertCounts = await getProducerAlertCounts(user.id);
  }

  return (
    <div className="min-h-screen bg-brand-light">
      {showProducerTabs ? (
        <DashboardNav
          pendingOrdersCount={alertCounts.pendingOrdersCount}
          pendingReviewsCount={alertCounts.pendingReviewsCount}
          unreadMessagesCount={alertCounts.unreadMessagesCount}
          showCareBookings={showCareBookings}
          showSubscriptions={showProducerTabs}
        />
      ) : (
        <BuyerDashboardNav />
      )}
      <main>{children}</main>
    </div>
  );
}
