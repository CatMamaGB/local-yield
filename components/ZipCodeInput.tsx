"use client";

/**
 * ZipCodeInput — validated US ZIP (5 or 5+4). Optional radius preference.
 */

import { useState, useId } from "react";
import { isValidZip } from "@/lib/utils";

export interface ZipCodeInputProps {
  /** Current value (controlled) */
  value: string;
  onChange: (zip: string) => void;
  /** Optional radius in miles (for preference) */
  radiusMiles?: number;
  onRadiusChange?: (miles: number) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  "aria-label"?: string;
}

const RADIUS_OPTIONS = [10, 25, 50, 100];

export function ZipCodeInput({
  value,
  onChange,
  radiusMiles = 25,
  onRadiusChange,
  placeholder = "e.g. 90210",
  className = "",
  required = false,
  "aria-label": ariaLabel = "ZIP code",
}: ZipCodeInputProps) {
  const id = useId();
  const [touched, setTouched] = useState(false);
  const trimmed = value.trim();
  const valid = !trimmed || isValidZip(trimmed);
  const showError = touched && trimmed.length > 0 && !valid;

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-brand">
        ZIP code {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="postal-code"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-invalid={showError}
        aria-describedby={showError ? `${id}-error` : undefined}
        className="mt-1 w-full rounded border border-brand/30 px-3 py-2 text-brand placeholder:text-brand/50 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      />
      {showError && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-600" role="alert">
          Enter a valid US ZIP (5 digits, e.g. 90210).
        </p>
      )}
      {onRadiusChange && (
        <div className="mt-3">
          <span className="block text-sm font-medium text-brand">Search radius (miles)</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {RADIUS_OPTIONS.map((miles) => (
              <button
                key={miles}
                type="button"
                onClick={() => onRadiusChange(miles)}
                className={`rounded px-3 py-1.5 text-sm font-medium transition ${
                  radiusMiles === miles
                    ? "bg-brand text-white"
                    : "border border-brand/30 text-brand hover:bg-brand-light"
                }`}
              >
                {miles} mi
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
