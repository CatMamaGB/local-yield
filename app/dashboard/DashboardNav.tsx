"use client";

/**
 * Producer dashboard navigation.
 * Config from NAV.dashboard (lib/nav-config); two-tier layout (primary + secondary rows).
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  NAV,
  isActiveHref,
  getBadgeCount,
  type NavRenderContext,
  type BadgeKey,
} from "@/lib/nav-config";

export interface DashboardNavProps {
  pendingOrdersCount?: number;
  pendingReviewsCount?: number;
  unreadMessagesCount?: number;
  showCareBookings?: boolean;
  showSubscriptions?: boolean;
}

function renderItem(
  pathname: string,
  item: { href: string; label: string; badge?: BadgeKey; match?: "exact" | "prefix"; external?: boolean; disabled?: boolean },
  badgeCounts: Record<BadgeKey, number>,
  baseClass: string,
  activeClass: string,
  inactiveClass: string
) {
  const active = isActiveHref(pathname, item.href, item.match ?? "prefix");
  const badgeCount = getBadgeCount(item.badge, badgeCounts);
  const className = `${baseClass} ${active ? activeClass : inactiveClass}`;

  if (item.disabled) {
    return (
      <span
        key={item.href}
        aria-disabled="true"
        className={`${className} cursor-not-allowed opacity-60`}
      >
        {item.label}
      </span>
    );
  }

  if (item.external) {
    return (
      <a
        key={item.href}
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {item.label}
        {badgeCount > 0 && (
          <span className="ml-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-accent-bright px-1.5 text-xs font-semibold text-white">
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </a>
    );
  }

  return (
    <Link key={item.href} href={item.href} className={className}>
      {item.label}
      {badgeCount > 0 && (
        <span className="ml-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-accent-bright px-1.5 text-xs font-semibold text-white">
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      )}
    </Link>
  );
}

export function DashboardNav({
  pendingOrdersCount = 0,
  pendingReviewsCount = 0,
  unreadMessagesCount = 0,
  showCareBookings = false,
  showSubscriptions = false,
}: DashboardNavProps) {
  const pathname = usePathname();

  const ctx: NavRenderContext = { showCareBookings, showSubscriptions };

  const badgeCounts: Record<BadgeKey, number> = {
    orders: pendingOrdersCount,
    messages: unreadMessagesCount,
    reviews: pendingReviewsCount,
  };

  const { sections } = NAV.dashboard;
  const primarySection = sections.find((s) => s.id === "primary")!;
  const secondarySection = sections.find((s) => s.id === "secondary")!;

  const primaryItems = primarySection.items.filter((it) => (it.when ? it.when(ctx) : true));
  const secondaryItems = secondarySection.items.filter((it) => (it.when ? it.when(ctx) : true));

  return (
    <nav className="border-b border-brand/10 bg-white shadow-farmhouse" aria-label="Dashboard sections">
      <div className="mx-auto max-w-6xl px-4 py-3">
        {/* PRIMARY ROW */}
        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-3" aria-label={primarySection.ariaLabel}>
          {primaryItems.map((item) =>
            renderItem(
              pathname,
              item,
              badgeCounts,
              "relative whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2",
              "bg-brand-accent text-white",
              "text-brand hover:bg-brand-light"
            )
          )}
        </div>

        {/* DIVIDER */}
        <div className="border-t border-brand/10" />

        {/* SECONDARY ROW */}
        <div className="mt-3 flex flex-nowrap items-center gap-1 overflow-x-auto" aria-label={secondarySection.ariaLabel}>
          {secondaryItems.map((item) => {
            const active = isActiveHref(pathname, item.href, item.match ?? "prefix");
            const badgeCount = getBadgeCount(item.badge, badgeCounts);
            const baseClass = "shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2";

            if (item.disabled) {
              return (
                <span key={item.href} aria-disabled="true" className={`${baseClass} cursor-not-allowed opacity-60`}>
                  {item.label}
                </span>
              );
            }
            if (item.external) {
              return (
                <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className={`${baseClass} ${active ? "bg-brand-accent text-white" : "text-brand hover:bg-brand-light"}`}>
                  {item.label}
                  {badgeCount > 0 && (
                    <span className="ml-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-accent-bright px-1.5 text-xs font-semibold text-white">
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </span>
                  )}
                </a>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${baseClass} ${active ? "bg-brand-accent text-white" : "text-brand hover:bg-brand-light"}`}
              >
                {item.label}
                {badgeCount > 0 && (
                  <span className="ml-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-accent-bright px-1.5 text-xs font-semibold text-white">
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
