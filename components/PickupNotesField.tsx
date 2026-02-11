"use client";

export interface PickupNotesFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function PickupNotesField({
  value,
  onChange,
  placeholder = "e.g. Meet at the red barn, Saturdays 9–12",
  className = "",
}: PickupNotesFieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-brand">Pickup notes</label>
      <p className="mt-0.5 text-xs text-brand/70">
        Shown to buyers when they choose pickup (address, times, instructions).
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand"
        placeholder={placeholder}
      />
    </div>
  );
}
