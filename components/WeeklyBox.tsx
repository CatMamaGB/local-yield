/**
 * Weekly veggie box subscription card.
 * Used on browse/shop and dashboard.
 */

import { formatPrice } from "@/lib/utils";
import { DeliveryBadge } from "./DeliveryBadge";

export interface WeeklyBoxProps {
  id: string;
  title: string;
  description: string;
  pricePerWeek: number;
  delivery: boolean;
  pickup: boolean;
  producerName?: string;
  producerId?: string;
}

export function WeeklyBox({
  id,
  title,
  description,
  pricePerWeek,
  delivery,
  pickup,
  producerName,
  producerId,
}: WeeklyBoxProps) {
  const href = producerId ? `/shop/${producerId}?box=${id}` : "#";
  return (
    <article className="overflow-hidden rounded-xl border border-brand-accent/30 bg-white shadow-sm">
      <a href={href} className="block p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold text-brand">{title}</h3>
            {producerName && (
              <p className="text-sm text-brand/70">by {producerName}</p>
            )}
          </div>
          <DeliveryBadge delivery={delivery} pickup={pickup} />
        </div>
        <p className="mt-2 text-sm text-brand/80">{description}</p>
        <p className="mt-2 font-semibold text-brand-accent">
          {formatPrice(pricePerWeek)}/week
        </p>
      </a>
    </article>
  );
}
