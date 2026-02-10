"use client";

/**
 * Main navigation for The Local Yield.
 * Admin link only shown when user.role === ADMIN (passed from layout).
 */

import Link from "next/link";
import Image from "next/image";
import { DevRoleSwitcher } from "@/components/DevRoleSwitcher";
import { isCareEnabled } from "@/lib/feature-flags";
import type { SessionUser } from "@/lib/auth";

interface NavbarProps {
  user: SessionUser | null;
}

export function Navbar({ user }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-brand/20 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-semibold text-brand">
          <Image src="/local-yield-logo.png" alt="Local Yield" width={32} height={32} />
          The Local Yield
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/market" className="text-brand hover:text-brand-accent">
            Market
          </Link>
          <Link href="/market/browse" className="text-brand hover:text-brand-accent">
            Browse
          </Link>
          {isCareEnabled() && (
            <Link href="/care" className="text-brand hover:text-brand-accent">
              Care
            </Link>
          )}
          <Link href="/about" className="text-brand hover:text-brand-accent">
            About
          </Link>
          <Link href="/auth/login" className="text-brand hover:text-brand-accent">
            Log in
          </Link>
          <Link href="/auth/signup" className="rounded bg-brand px-4 py-2 text-white hover:bg-brand/90">
            Sign up
          </Link>
          <Link href="/dashboard" className="text-brand hover:text-brand-accent">
            Dashboard
          </Link>
          {user?.role === "ADMIN" && (
            <Link href="/admin/users" className="text-brand hover:text-brand-accent">
              Admin
            </Link>
          )}
          <DevRoleSwitcher />
        </div>
      </nav>
    </header>
  );
}
