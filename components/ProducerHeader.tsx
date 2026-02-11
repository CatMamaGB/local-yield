/**
 * ProducerHeader — name, bio, distance, delivery badge for shop page.
 */

import { DeliveryBadge } from "./DeliveryBadge";

export interface ProducerHeaderProps {
  name: string | null;
  bio: string | null;
  distanceMiles: number | null;
  offersDelivery: boolean;
  deliveryFeeCents: number;
  pickup: boolean;
}

export function ProducerHeader({
  name,
  bio,
  distanceMiles,
  offersDelivery,
  deliveryFeeCents,
  pickup,
}: ProducerHeaderProps) {
  return (
    <header className="rounded-xl border border-brand/20 bg-white p-6 shadow-sm">
      <h1 className="font-display text-2xl font-semibold text-brand">
        {name || "Producer"}
      </h1>
      {bio && <p className="mt-2 text-brand/80">{bio}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {distanceMiles != null && (
          <span className="rounded bg-brand-light px-2 py-1 text-sm text-brand">
            ~{distanceMiles} mi away
          </span>
        )}
        <DeliveryBadge delivery={offersDelivery && deliveryFeeCents >= 0} pickup={pickup} />
        {offersDelivery && deliveryFeeCents > 0 && (
          <span className="text-sm text-brand/70">
            Delivery fee: ${(deliveryFeeCents / 100).toFixed(2)}
          </span>
        )}
      </div>
    </header>
  );
}
