"use client";

/**
 * Buyer dashboard nav: single row, inline links.
 * Config from NAV.buyer (lib/nav-config); variant "row".
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV, isActiveHref } from "@/lib/nav-config";

export function BuyerDashboardNav() {
  const pathname = usePathname();
  const links = NAV.buyer.links;

  return (
    <nav
      className="border-b border-brand/10 bg-white px-4 py-3 shadow-farmhouse"
      aria-label="Dashboard sections"
    >
      <div className="mx-auto flex max-w-6xl flex-nowrap items-center gap-1 overflow-x-auto">
        {links.map((link) => {
          const isActive = !link.disabled && isActiveHref(pathname, link.href, link.match ?? "prefix");
          const linkClass = `shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 ${
            isActive
              ? "bg-brand-accent text-white"
              : "text-brand hover:bg-brand-light"
          }`;

          if (link.disabled) {
            return (
              <span key={link.href} aria-disabled="true" className={`${linkClass} cursor-not-allowed opacity-60`}>
                {link.label}
              </span>
            );
          }
          if (link.external) {
            return (
              <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                {link.label}
              </a>
            );
          }
          return (
            <Link key={link.href} href={link.href} className={linkClass}>
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
