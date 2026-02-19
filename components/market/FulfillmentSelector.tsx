"use client";

export type FulfillmentType = "PICKUP" | "DELIVERY";

export interface FulfillmentSelectorProps {
  value: FulfillmentType;
  onChange: (value: FulfillmentType) => void;
  offersDelivery: boolean;
  deliveryFeeCents: number;
  className?: string;
}

export function FulfillmentSelector({
  value,
  onChange,
  offersDelivery,
  deliveryFeeCents,
  className = "",
}: FulfillmentSelectorProps) {
  return (
    <div className={className}>
      <span className="block text-sm font-medium text-brand">Fulfillment</span>
      <div className="mt-2 flex flex-wrap gap-3">
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-brand/30 bg-white px-4 py-3 transition has-[:checked]:border-brand has-[:checked]:bg-brand-light/50">
          <input
            type="radio"
            name="fulfillment"
            value="PICKUP"
            checked={value === "PICKUP"}
            onChange={() => onChange("PICKUP")}
            className="h-4 w-4 border-brand text-brand"
          />
          <span className="font-medium text-brand">Pickup</span>
        </label>
        {offersDelivery && (
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-brand/30 bg-white px-4 py-3 transition has-[:checked]:border-brand has-[:checked]:bg-brand-light/50">
            <input
              type="radio"
              name="fulfillment"
              value="DELIVERY"
              checked={value === "DELIVERY"}
              onChange={() => onChange("DELIVERY")}
              className="h-4 w-4 border-brand text-brand"
            />
            <span className="font-medium text-brand">
              Delivery {deliveryFeeCents > 0 && `(+$${(deliveryFeeCents / 100).toFixed(2)})`}
            </span>
          </label>
        )}
      </div>
    </div>
  );
}
