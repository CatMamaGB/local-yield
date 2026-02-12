"use client";

/**
 * Role selection for sign-up: multi-select with clear descriptions.
 * Buyer, Producer, Caregiver, Care Seeker. Admin is never offered during sign-up.
 */

export const SIGNUP_ROLES = [
  { id: "BUYER" as const, label: "Buyer", description: "Shop local goods." },
  { id: "PRODUCER" as const, label: "Producer", description: "Sell products." },
  { id: "CAREGIVER" as const, label: "Caregiver", description: "Offer animal care." },
  { id: "CARE_SEEKER" as const, label: "Care Seeker", description: "Hire animal care." },
] as const;

export type SignUpRoleId = (typeof SIGNUP_ROLES)[number]["id"];

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
  "aria-label": ariaLabel = "Choose your roles",
}: RoleSelectionProps) {
  function toggle(roleId: SignUpRoleId) {
    const next = value.includes(roleId)
      ? value.filter((r) => r !== roleId)
      : [...value, roleId];
    onChange(next);
  }

  return (
    <div className={className} role="group" aria-label={ariaLabel}>
      <p className="mb-2 block text-sm font-medium text-brand">
        Select your roles
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
      <p className="mt-2 text-xs text-brand/70">Select all that apply. You can change this later.</p>
    </div>
  );
}
