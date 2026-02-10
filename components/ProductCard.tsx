/**
 * Product card for browse and shop pages.
 * Supports stock image fallback and delivery/pickup badges.
 */

import Link from "next/link";
import { DeliveryBadge } from "./DeliveryBadge";
import { formatPrice } from "@/lib/utils";

export interface ProductCardProps {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string | null;
  category: string;
  delivery: boolean;
  pickup: boolean;
  producerId?: string;
}

export function ProductCard({
  id,
  title,
  description,
  price,
  imageUrl,
  category,
  delivery,
  pickup,
  producerId,
}: ProductCardProps) {
  const shopHref = producerId ? `/market/shop/${producerId}` : "#";
  return (
    <article className="overflow-hidden rounded-xl border border-brand/20 bg-white shadow-sm transition hover:shadow-md">
      <Link href={shopHref} className="block">
        <div className="aspect-[4/3] bg-brand-light flex items-center justify-center">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-brand/50 text-sm">No image</span>
          )}
        </div>
        <div className="p-4">
          <span className="text-xs font-medium uppercase text-brand/70">{category}</span>
          <h2 className="font-display mt-1 text-lg font-semibold text-brand">{title}</h2>
          <p className="mt-1 line-clamp-2 text-sm text-brand/80">{description}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-semibold text-brand">{formatPrice(price)}</span>
            <DeliveryBadge delivery={delivery} pickup={pickup} />
          </div>
        </div>
      </Link>
    </article>
  );
}
