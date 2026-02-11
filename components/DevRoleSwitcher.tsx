"use client";

/**
 * Dev-only role switcher for testing buyer, producer, and admin flows without real auth.
 * Shown only in development or when NEXT_PUBLIC_ENABLE_DEV_TOOLS=true (staging).
 * Sets __dev_user cookie; getCurrentUser() reads it.
 *
 * Renders as a single "Dev" dropdown so the main nav stays clean:
 * - Switch view-as role (Buyer / Producer / Admin)
 * - Quick links to Dashboard and Admin for easy testing
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDownIcon, UserCircleIcon } from "@heroicons/react/20/solid";
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

const showDevTools =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_ENABLE_DEV_TOOLS === "true";

export function DevRoleSwitcher() {
  const router = useRouter();
  const [pendingRole, setPendingRole] = useState<Role | null>(null);

  // Apply cookie in effect so React Compiler allows it (no direct mutation in render/event).
  useEffect(() => {
    if (pendingRole === null) return;
    document.cookie = `${COOKIE_NAME}=${pendingRole}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    router.refresh();
    queueMicrotask(() => setPendingRole(null));
  }, [pendingRole, router]);

  if (!showDevTools) {
    return null;
  }

  const current = getStoredRole();

  function setRole(role: Role) {
    setPendingRole(role);
  }

  return (
    <Menu as="div" className="relative">
      <MenuButton
        className="inline-flex items-center gap-1 rounded-md border border-brand/30 bg-amber-50/80 px-2.5 py-1.5 text-xs font-medium text-brand hover:bg-amber-50"
        aria-label="Development tools: switch role and quick links"
      >
        <UserCircleIcon className="h-4 w-4" aria-hidden />
        <span>Dev</span>
        <ChevronDownIcon className="h-3.5 w-3.5" aria-hidden />
      </MenuButton>
      <MenuItems
        anchor="bottom end"
        className="z-50 mt-1 w-56 origin-top-right rounded-lg border border-brand/20 bg-white py-1 shadow-lg focus:outline-none"
      >
        <div className="border-b border-brand/10 px-3 py-2">
          <p className="text-xs font-medium text-brand/70">View as</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={
                  current === r.value
                    ? "rounded bg-brand px-2 py-1 text-xs font-medium text-white"
                    : "rounded border border-brand/30 bg-white px-2 py-1 text-xs text-brand hover:bg-amber-50/80"
                }
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div className="px-3 py-2">
          <p className="text-xs font-medium text-brand/70">Quick links</p>
          <div className="mt-1.5 flex flex-col gap-0.5">
            <MenuItem>
              {({ focus }) => (
                <a
                  href="/dashboard"
                  className={`block rounded px-2 py-1.5 text-left text-sm ${focus ? "bg-amber-50/80 text-brand" : "text-brand/90"}`}
                >
                  Dashboard
                </a>
              )}
            </MenuItem>
            <MenuItem>
              {({ focus }) => (
                <a
                  href="/admin/users"
                  className={`block rounded px-2 py-1.5 text-left text-sm ${focus ? "bg-amber-50/80 text-brand" : "text-brand/90"}`}
                >
                  Admin
                </a>
              )}
            </MenuItem>
          </div>
        </div>
      </MenuItems>
    </Menu>
  );
}
