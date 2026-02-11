"use client";

export interface DeliverySettingsProps {
  offersDelivery: boolean;
  onOffersDeliveryChange: (value: boolean) => void;
  deliveryFeeCents: number;
  onDeliveryFeeCentsChange: (value: number) => void;
  className?: string;
}

export function DeliverySettings({
  offersDelivery,
  onOffersDeliveryChange,
  deliveryFeeCents,
  onDeliveryFeeCentsChange,
  className = "",
}: DeliverySettingsProps) {
  return (
    <div className={`rounded-xl border border-brand/20 bg-white p-4 ${className}`}>
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={offersDelivery}
          onChange={(e) => onOffersDeliveryChange(e.target.checked)}
          className="h-4 w-4 rounded border-brand text-brand"
        />
        <span className="font-medium text-brand">Offer delivery</span>
      </label>
      <p className="mt-1 text-xs text-brand/70">
        Buyers can choose delivery at checkout; you set the fee below.
      </p>
      {offersDelivery && (
        <div className="mt-3">
          <label className="block text-sm font-medium text-brand">Delivery fee ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={(deliveryFeeCents / 100).toFixed(2)}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              onDeliveryFeeCentsChange(Number.isNaN(v) ? 0 : Math.round(v * 100));
            }}
            className="mt-1 w-full max-w-[6rem] rounded border border-brand/30 px-3 py-2 text-brand"
          />
        </div>
      )}
    </div>
  );
}
