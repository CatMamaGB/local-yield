/**
 * Badge showing delivery and/or pickup options for a listing.
 */

export interface DeliveryBadgeProps {
  delivery: boolean;
  pickup: boolean;
}

export function DeliveryBadge({ delivery, pickup }: DeliveryBadgeProps) {
  if (!delivery && !pickup) return null;
  return (
    <div className="flex gap-1">
      {pickup && (
        <span className="rounded bg-brand-accent/20 px-2 py-0.5 text-xs font-medium text-brand-accent">
          Pickup
        </span>
      )}
      {delivery && (
        <span className="rounded bg-brand/20 px-2 py-0.5 text-xs font-medium text-brand">
          Delivery
        </span>
      )}
    </div>
  );
}
