/**
 * Single listing row for browse: title, distance, label (Nearby 🟢 / Farther Out 🔵).
 * Optional future: "Coming This Way Soon?" / "Order + Meet Here".
 */

import Link from "next/link";
import { DeliveryBadge } from "./DeliveryBadge";
import { formatPrice } from "@/lib/utils";
import type { BrowseListing } from "@/types/listings";

export interface ListingRowProps {
  listing: BrowseListing;
}

export function ListingRow({ listing }: ListingRowProps) {
  const shopHref = `/market/shop/${listing.producerId}`;
  const distanceText =
    listing.distance != null ? `${listing.distance} mi` : "—";
  const isNearby = listing.label === "nearby";

  return (
    <tr className="border-b border-brand/10 transition hover:bg-brand-light/40">
      <td className="py-4 pr-4">
        <Link href={shopHref} className="group flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 rounded-lg -m-1 p-1">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-light text-2xl">
            {listing.category === "Produce" && "🥕"}
            {listing.category === "Dairy" && "🧀"}
            {listing.category === "Pantry" && "🍯"}
            {!["Produce", "Dairy", "Pantry"].includes(listing.category) && "📦"}
          </div>
          <div>
            <span className="font-display font-semibold text-brand group-hover:text-brand-accent">
              {listing.title}
            </span>
            {listing.producerName && (
              <span className="ml-2 text-sm text-brand/80">
                by {listing.producerName}
              </span>
            )}
            <div className="mt-0.5 flex items-center gap-2">
              <span className="text-sm font-medium text-brand">
                {formatPrice(listing.price)}
              </span>
              <DeliveryBadge delivery={listing.delivery} pickup={listing.pickup} />
            </div>
          </div>
        </Link>
      </td>
      <td className="py-4 text-center text-brand/80">{distanceText}</td>
      <td className="py-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
            isNearby
              ? "bg-emerald-100 text-emerald-800"
              : "bg-sky-100 text-sky-800"
          }`}
        >
          {isNearby ? (
            <>
              <span className="size-2 rounded-full bg-emerald-500" aria-hidden />
              Nearby
            </>
          ) : (
            <>
              <span className="size-2 rounded-full bg-sky-500" aria-hidden />
              Farther Out
            </>
          )}
        </span>
      </td>
    </tr>
  );
}
