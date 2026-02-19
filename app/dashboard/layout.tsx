/**
 * Dashboard layout: for producers/admins, show DashboardNav; otherwise BuyerDashboardNav.
 * __last_active_mode cookie is set in proxy.ts (Next.js 16 only allows cookie mutation there).
 */

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserCapabilities } from "@/lib/authz/client";
import { getProducerAlertCounts } from "@/lib/dashboard-alerts";
import { DashboardNav } from "./DashboardNav";
import { BuyerDashboardNav } from "./BuyerDashboardNav";
import { OnboardingChecklistBanner } from "@/components/OnboardingChecklistBanner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const { canSell, canCare } = getUserCapabilities(user);
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
        />
      ) : (
        <BuyerDashboardNav />
      )}
      <div className="mx-auto max-w-6xl px-4 py-3">
        <OnboardingChecklistBanner />
      </div>
      <main>{children}</main>
    </div>
  );
}
