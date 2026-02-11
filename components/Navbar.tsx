"use client";

/**
 * Main navigation for The Local Yield.
 * Rover-style: clear seeker vs provider paths — Browse (buyer), Become a Caregiver (care), Sell (producer).
 * Dashboard/Admin only when user role matches (from layout); Dev dropdown in dev only.
 */

import Link from "next/link";
import Image from "next/image";
import { CartLink } from "@/components/CartLink";
import { DevRoleSwitcher } from "@/components/DevRoleSwitcher";
import { SignOutButton } from "@/components/SignOutButton";
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
        {/* Left nav: primary actions by role (seeker vs provider) */}
        <div className="flex items-center gap-5">
          <Link href="/market/browse" className="font-medium text-brand hover:text-brand-accent">
            Browse
          </Link>
          {isCareEnabled() && (
            <Link href="/care" className="font-medium text-brand hover:text-brand-accent">
              Become a Caregiver
            </Link>
          )}
          <Link href={user?.role === "PRODUCER" || user?.role === "ADMIN" ? "/dashboard" : "/auth/signup"} className="font-medium text-brand hover:text-brand-accent">
            Sell
          </Link>
          <Link href="/market" className="text-brand/80 hover:text-brand-accent">
            Market
          </Link>
          <Link href="/about" className="text-brand/80 hover:text-brand-accent">
            About
          </Link>
          <CartLink />
        </div>
        {/* Right nav: account + dev */}
        <div className="flex items-center gap-4">
          {!user ? (
            <>
              <Link href="/auth/login" className="text-brand hover:text-brand-accent">
                Sign in
              </Link>
              <Link href="/auth/signup" className="rounded bg-brand px-4 py-2 text-white hover:bg-brand/90">
                Sign up
              </Link>
            </>
          ) : (
            <>
          {(user?.role === "PRODUCER" || user?.role === "ADMIN") && (
            <Link href="/dashboard" className="text-brand/80 hover:text-brand-accent">
              Dashboard
            </Link>
          )}
          {user?.role === "ADMIN" && (
            <Link href="/admin/users" className="text-brand/80 hover:text-brand-accent">
              Admin
            </Link>
          )}
          <SignOutButton />
            </>
          )}
          <DevRoleSwitcher />
        </div>
      </nav>
    </header>
  );
}
