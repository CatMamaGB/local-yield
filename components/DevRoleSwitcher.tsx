"use client";

/**
 * Dev-only role switcher for testing buyer, producer, and admin flows without real auth.
 * Shown only in development or when NEXT_PUBLIC_ENABLE_DEV_TOOLS=true (staging). Sets __dev_user cookie; getCurrentUser() reads it.
 */

import { useRouter } from "next/navigation";
import type { Role } from "@/types";

const ROLES: { value: Role; label: string }[] = [
  { value: "BUYER", label: "Buyer" },
  { value: "PRODUCER", label: "Producer" },
  { value: "ADMIN", label: "Admin" },
];

const COOKIE_NAME = "__dev_user";
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

function getStoredRole(): Role {
  if (typeof document === "undefined") return "BUYER";
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  const value = match?.[1];
  if (value === "BUYER" || value === "PRODUCER" || value === "ADMIN") return value;
  return "BUYER";
}

/**
 * Shown only in development or when NEXT_PUBLIC_ENABLE_DEV_TOOLS=true (e.g. staging).
 * Never shown in production so the public site stays clean for launch.
 */
const showDevTools =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_ENABLE_DEV_TOOLS === "true";

export function DevRoleSwitcher() {
  const router = useRouter();

  if (!showDevTools) {
    return null;
  }

  const current = getStoredRole();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const role = e.target.value as Role;
    document.cookie = `${COOKIE_NAME}=${role}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-brand/60">Dev:</span>
      <select
        value={current}
        onChange={handleChange}
        className="rounded border border-brand/30 bg-white/80 px-2 py-1 text-xs text-brand"
        aria-label="Switch dev user role (development only)"
      >
        {ROLES.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
    </div>
  );
}
