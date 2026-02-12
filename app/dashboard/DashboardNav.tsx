"use client";

/**
 * Producer dashboard tab navigation: Customers, Sales Analytics, Orders, Messages.
 * Plus links to Profile, Products, Events, Records. Shown when user is producer or admin.
 * Shows badges for pending orders, reviews, messages.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard/customers", label: "Customers" },
  { href: "/dashboard/analytics", label: "Sales Analytics" },
  { href: "/dashboard/orders", label: "Orders", badge: "orders" as const },
  { href: "/dashboard/messages", label: "Messages", badge: "messages" as const },
] as const;

const SECONDARY = [
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/products", label: "Products" },
  { href: "/dashboard/events", label: "Events" },
  { href: "/dashboard/reviews", label: "Reviews", badge: "reviews" as const },
  { href: "/dashboard/records", label: "Records" },
];

export interface DashboardNavProps {
  pendingOrdersCount?: number;
  pendingReviewsCount?: number;
  unreadMessagesCount?: number;
}

export function DashboardNav({
  pendingOrdersCount = 0,
  pendingReviewsCount = 0,
  unreadMessagesCount = 0,
}: DashboardNavProps) {
  const pathname = usePathname();
  
  const badgeCounts = {
    orders: pendingOrdersCount,
    messages: unreadMessagesCount,
    reviews: pendingReviewsCount,
  };

  return (
    <nav className="border-b border-brand/20 bg-white px-4 py-3" aria-label="Dashboard sections">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4">
        <div className="flex flex-wrap gap-1">
          {TABS.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
            const badgeCount = "badge" in tab && tab.badge ? badgeCounts[tab.badge] : 0;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive
                    ? "bg-brand text-white"
                    : "text-brand hover:bg-brand-light"
                }`}
              >
                {tab.label}
                {badgeCount > 0 && (
                  <span className="ml-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-accent px-1.5 text-xs font-semibold text-white">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
        <div className="ml-auto flex flex-wrap gap-1 border-l border-brand/20 pl-4">
          {SECONDARY.map((link) => {
            const isActive = pathname === link.href;
            const badgeCount = "badge" in link && link.badge ? badgeCounts[link.badge] : 0;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative rounded-lg px-2 py-1.5 text-sm ${
                  isActive ? "font-medium text-brand" : "text-brand/70 hover:text-brand"
                }`}
              >
                {link.label}
                {badgeCount > 0 && (
                  <span className="ml-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-brand-accent px-1 text-xs font-semibold text-white">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
