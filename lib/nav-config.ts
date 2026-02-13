/**
 * Shared nav config and helpers for DashboardNav (producer), AdminNav, BuyerDashboardNav.
 * Single place to add/remove/reorder nav items and sections.
 * Use NAV.dashboard | NAV.admin | NAV.buyer for a single import; variant drives render style.
 */

// -----------------------------------------------------------------------------
// Match mode: centralize exact vs prefix active logic
// -----------------------------------------------------------------------------

export type MatchMode = "exact" | "prefix";

export function isActiveHref(
  pathname: string,
  href: string,
  match: MatchMode = "prefix"
): boolean {
  if (match === "exact") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

// -----------------------------------------------------------------------------
// Producer dashboard (two-tier: primary + secondary rows) — variant "tabs"
// -----------------------------------------------------------------------------

export type BadgeKey = "orders" | "messages" | "reviews";

export type NavRenderContext = {
  showCareBookings: boolean;
  showSubscriptions: boolean;
};

export type NavItem = {
  href: string;
  label: string;
  badge?: BadgeKey;
  match?: MatchMode;
  external?: boolean;
  disabled?: boolean;
  when?: (ctx: NavRenderContext) => boolean;
};

export type NavSection = {
  id: "primary" | "secondary";
  ariaLabel: string;
  items: readonly NavItem[];
};

export const DASHBOARD_NAV_CONFIG: readonly NavSection[] = [
  {
    id: "primary",
    ariaLabel: "Primary dashboard tabs",
    items: [
      { href: "/dashboard/revenue", label: "Revenue" },
      { href: "/dashboard/customers", label: "Customers" },
      { href: "/dashboard/analytics", label: "Sales Analytics" },
      { href: "/dashboard/orders", label: "Orders", badge: "orders" },
      { href: "/dashboard/messages", label: "Messages", badge: "messages" },
    ] as const,
  },
  {
    id: "secondary",
    ariaLabel: "Secondary dashboard links",
    items: [
      { href: "/dashboard/profile", label: "Profile" },
      { href: "/dashboard/products", label: "Products" },
      { href: "/dashboard/events", label: "Events" },
      { href: "/dashboard/reviews", label: "Reviews", badge: "reviews" },
      { href: "/dashboard/records", label: "Records" },
      {
        href: "/dashboard/care-bookings",
        label: "Care bookings",
        when: (ctx) => ctx.showCareBookings,
      },
      {
        href: "/dashboard/subscriptions",
        label: "Subscriptions",
        when: (ctx) => ctx.showSubscriptions,
      },
    ] as const,
  },
] as const;

// -----------------------------------------------------------------------------
// Admin + Buyer (single row, inline links) — variant "row"
// -----------------------------------------------------------------------------

export type RowNavLink = {
  href: string;
  label: string;
  match?: MatchMode;
  external?: boolean;
  disabled?: boolean;
};

export const ADMIN_ROW_NAV: readonly RowNavLink[] = [
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/flagged-reviews", label: "Flagged reviews" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/listings", label: "Listings" },
  { href: "/admin/custom-categories", label: "Custom categories" },
];

export const BUYER_ROW_NAV: readonly RowNavLink[] = [
  { href: "/dashboard", label: "Dashboard", match: "exact" },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/orders", label: "Order history" },
];

// -----------------------------------------------------------------------------
// Unified export: one import for components; variant drives render style
// -----------------------------------------------------------------------------

export const NAV = {
  dashboard: { variant: "tabs" as const, sections: DASHBOARD_NAV_CONFIG },
  admin: { variant: "row" as const, links: ADMIN_ROW_NAV },
  buyer: { variant: "row" as const, links: BUYER_ROW_NAV },
} as const;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

export function getBadgeCount(
  badge: BadgeKey | undefined,
  counts: Record<BadgeKey, number>
): number {
  if (!badge) return 0;
  return counts[badge] ?? 0;
}
