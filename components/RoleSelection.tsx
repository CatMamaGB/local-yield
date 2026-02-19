"use client";

/**
 * Role selection for sign-up: multi-select. Buyer is always on (not shown).
 * "What else would you like to do?" — Sell, Offer help, Find help. Admin is never offered.
 */

/** Roles offered at signup (Buyer is default for everyone, not selectable). */
export const SIGNUP_ROLES = [
  { id: "PRODUCER" as const, label: "Sell goods", description: "Sell products from your shop." },
  { id: "CAREGIVER" as const, label: "Offer help / services", description: "Offer animal care or homestead help." },
  { id: "CARE_SEEKER" as const, label: "Find help on my property", description: "Post jobs for animal care or homestead work." },
] as const;

/** All signup role ids including BUYER (for APIs that accept full set). */
export type SignUpRoleId = (typeof SIGNUP_ROLES)[number]["id"] | "BUYER";

export interface RoleSelectionProps {
  value: SignUpRoleId[];
  onChange: (roles: SignUpRoleId[]) => void;
  className?: string;
  "aria-label"?: string;
}

export function RoleSelection({
  value,
  onChange,
  className = "",
  "aria-label": ariaLabel = "What else would you like to do?",
}: RoleSelectionProps) {
  function toggle(roleId: (typeof SIGNUP_ROLES)[number]["id"]) {
    const next = value.includes(roleId)
      ? value.filter((r) => r !== roleId)
      : [...value, roleId];
    onChange(next);
  }

  return (
    <div className={className} role="group" aria-label={ariaLabel}>
      <p className="mb-2 block text-sm font-medium text-brand">
        What else would you like to do?
      </p>
      <div className="space-y-3">
        {SIGNUP_ROLES.map((role) => (
          <label
            key={role.id}
            className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-brand/30 bg-white px-4 py-3 transition has-[:checked]:border-brand has-[:checked]:bg-brand-light/50"
          >
            <input
              type="checkbox"
              name="roles"
              value={role.id}
              checked={value.includes(role.id)}
              onChange={() => toggle(role.id)}
              className="mt-1 h-4 w-4 shrink-0 border-brand text-brand focus:ring-brand"
            />
            <div>
              <span className="font-medium text-brand">{role.label}</span>
              <p className="mt-0.5 text-sm text-brand/80">{role.description}</p>
            </div>
          </label>
        ))}
      </div>
      <p className="mt-2 text-xs text-brand/70">You can add these later in Settings.</p>
    </div>
  );
}
