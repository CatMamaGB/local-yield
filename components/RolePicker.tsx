"use client";

/**
 * RolePicker — choose Buyer or Producer for onboarding / sign-up.
 */

import type { Role } from "@/types";

export interface RolePickerProps {
  value: "BUYER" | "PRODUCER" | null;
  onChange: (role: "BUYER" | "PRODUCER") => void;
  className?: string;
  "aria-label"?: string;
}

export function RolePicker({
  value,
  onChange,
  className = "",
  "aria-label": ariaLabel = "I want to",
}: RolePickerProps) {
  return (
    <div className={className} role="group" aria-label={ariaLabel}>
      <span className="block text-sm font-medium text-brand">I want to</span>
      <div className="mt-2 flex flex-wrap gap-3">
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-brand/30 bg-white px-4 py-3 transition has-[:checked]:border-brand has-[:checked]:bg-brand-light/50">
          <input
            type="radio"
            name="role"
            value="BUYER"
            checked={value === "BUYER"}
            onChange={() => onChange("BUYER")}
            className="h-4 w-4 border-brand text-brand focus:ring-brand"
          />
          <span className="font-medium text-brand">Buy local goods</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-brand/30 bg-white px-4 py-3 transition has-[:checked]:border-brand has-[:checked]:bg-brand-light/50">
          <input
            type="radio"
            name="role"
            value="PRODUCER"
            checked={value === "PRODUCER"}
            onChange={() => onChange("PRODUCER")}
            className="h-4 w-4 border-brand text-brand focus:ring-brand"
          />
          <span className="font-medium text-brand">Sell my goods</span>
        </label>
      </div>
    </div>
  );
}
