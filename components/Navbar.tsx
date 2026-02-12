"use client";

/**
 * Main navigation for The Local Yield.
 * Mode Switcher (Market | Sell | Care) when user has multiple roles.
 * Rover-style: Browse, Care, Sell. Mobile-responsive with hamburger menu.
 */

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { CartLink } from "@/components/CartLink";
import { SignOutButton } from "@/components/SignOutButton";
import { isCareEnabled } from "@/lib/feature-flags";
import { hasMultipleModes } from "@/lib/authz";
import type { SessionUser } from "@/lib/auth";

interface NavbarProps {
  user: SessionUser | null;
}

export function Navbar({ user }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isProducer =
    user?.role === "PRODUCER" || user?.role === "ADMIN" || user?.isProducer === true;
  const isCare = user?.isCaregiver === true || user?.isHomesteadOwner === true;
  const showModeSwitcher = user && hasMultipleModes(user);

  // Context detection: are we in dashboard/producer mode?
  const inDashboard = pathname.startsWith("/dashboard");
  const inMarket = pathname.startsWith("/market");
  const inCare = pathname.startsWith("/care");

  // Show market nav (Browse, About, Cart) unless in dashboard
  const showMarketNav = !inDashboard;
  // Show dashboard links when in dashboard or when user is producer/admin
  const showDashboardLinks = inDashboard && isProducer;

  async function setPrimaryMode(mode: "MARKET" | "SELL" | "CARE") {
    try {
      await fetch("/api/auth/primary-mode", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryMode: mode }),
      });
    } catch {
      // best effort
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-brand/20 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-semibold text-brand">
          <Image src="/local-yield-logo.png" alt="Local Yield" width={32} height={32} />
          <span className="hidden sm:inline">The Local Yield</span>
          <span className="sm:hidden">Local Yield</span>
        </Link>

        {/* Mode Switcher (when user has multiple roles) */}
        {showModeSwitcher && (
          <div className="hidden md:flex items-center gap-1 rounded-lg border border-brand/20 bg-brand-light/30 p-1">
            <Link
              href="/market"
              onClick={() => setPrimaryMode("MARKET")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                pathname.startsWith("/market") ? "bg-white text-brand shadow-sm" : "text-brand/80 hover:text-brand"
              }`}
            >
              Market
            </Link>
            {isProducer && (
              <Link
                href="/dashboard"
                onClick={() => setPrimaryMode("SELL")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  pathname.startsWith("/dashboard") ? "bg-white text-brand shadow-sm" : "text-brand/80 hover:text-brand"
                }`}
              >
                Sell
              </Link>
            )}
            {isCare && isCareEnabled() && (
              <Link
                href="/care"
                onClick={() => setPrimaryMode("CARE")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  pathname.startsWith("/care") ? "bg-white text-brand shadow-sm" : "text-brand/80 hover:text-brand"
                }`}
              >
                Care
              </Link>
            )}
          </div>
        )}

        {/* Desktop nav: context-aware primary actions */}
        {showMarketNav && (
          <div className="hidden md:flex items-center gap-5">
            <Link href="/market/browse" className="font-medium text-brand hover:text-brand-accent">
              Browse
            </Link>
            {isCareEnabled() && !inCare && (
              <Link href="/care" className="font-medium text-brand hover:text-brand-accent">
                Become a Caregiver
              </Link>
            )}
            {!isProducer && (
              <Link href="/auth/signup" className="font-medium text-brand hover:text-brand-accent">
                Sell
              </Link>
            )}
            <Link href="/about" className="text-brand/80 hover:text-brand-accent">
              About
            </Link>
            <CartLink />
          </div>
        )}
        
        {showDashboardLinks && (
          <div className="hidden md:flex items-center gap-4">
            <Link href="/dashboard/orders" className="text-sm font-medium text-brand hover:text-brand-accent">
              Orders
            </Link>
            <Link href="/dashboard/messages" className="text-sm font-medium text-brand hover:text-brand-accent">
              Messages
            </Link>
            <Link href="/dashboard/products" className="text-sm font-medium text-brand hover:text-brand-accent">
              Products
            </Link>
            <Link href="/dashboard/reviews" className="text-sm font-medium text-brand hover:text-brand-accent">
              Reviews
            </Link>
          </div>
        )}

        {/* Desktop nav: account */}
        <div className="hidden md:flex items-center gap-4">
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
              {isProducer && (
                <Link href="/dashboard" className="text-brand/80 hover:text-brand-accent">
                  Dashboard
                </Link>
              )}
              {user.role === "ADMIN" && (
                <Link href="/admin/users" className="text-brand/80 hover:text-brand-accent">
                  Admin
                </Link>
              )}
              <SignOutButton />
            </>
          )}
        </div>

        {/* Mobile: cart (market only) + menu button */}
        <div className="flex md:hidden items-center gap-3">
          {showMarketNav && <CartLink />}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-brand hover:text-brand-accent"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-brand/20 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-4 space-y-3">
            {showModeSwitcher && (
              <div className="flex gap-2 pb-2 border-b border-brand/10">
                <Link href="/market" onClick={() => { setPrimaryMode("MARKET"); setMobileMenuOpen(false); }} className="rounded-md px-3 py-2 text-sm font-medium bg-brand-light/50 text-brand">
                  Market
                </Link>
                {isProducer && (
                  <Link href="/dashboard" onClick={() => { setPrimaryMode("SELL"); setMobileMenuOpen(false); }} className="rounded-md px-3 py-2 text-sm font-medium bg-brand-light/50 text-brand">
                    Sell
                  </Link>
                )}
                {isCare && isCareEnabled() && (
                  <Link href="/care" onClick={() => { setPrimaryMode("CARE"); setMobileMenuOpen(false); }} className="rounded-md px-3 py-2 text-sm font-medium bg-brand-light/50 text-brand">
                    Care
                  </Link>
                )}
              </div>
            )}
            {showMarketNav && (
              <>
                <Link
                  href="/market/browse"
                  className="block font-medium text-brand hover:text-brand-accent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Browse
                </Link>
                {isCareEnabled() && !inCare && (
                  <Link
                    href="/care"
                    className="block font-medium text-brand hover:text-brand-accent"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Become a Caregiver
                  </Link>
                )}
                {!isProducer && (
                  <Link
                    href="/auth/signup"
                    className="block font-medium text-brand hover:text-brand-accent"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sell
                  </Link>
                )}
                <Link
                  href="/about"
                  className="block text-brand/80 hover:text-brand-accent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About
                </Link>
              </>
            )}
            {showDashboardLinks && (
              <>
                <Link href="/dashboard/orders" className="block font-medium text-brand hover:text-brand-accent" onClick={() => setMobileMenuOpen(false)}>
                  Orders
                </Link>
                <Link href="/dashboard/messages" className="block font-medium text-brand hover:text-brand-accent" onClick={() => setMobileMenuOpen(false)}>
                  Messages
                </Link>
                <Link href="/dashboard/products" className="block font-medium text-brand hover:text-brand-accent" onClick={() => setMobileMenuOpen(false)}>
                  Products
                </Link>
                <Link href="/dashboard/reviews" className="block font-medium text-brand hover:text-brand-accent" onClick={() => setMobileMenuOpen(false)}>
                  Reviews
                </Link>
              </>
            )}
            <div className="pt-3 border-t border-brand/20 space-y-3">
              {!user ? (
                <>
                  <Link
                    href="/auth/login"
                    className="block text-brand hover:text-brand-accent"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="block rounded bg-brand px-4 py-2 text-white hover:bg-brand/90 text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign up
                  </Link>
                </>
              ) : (
                <>
                  {isProducer && (
                    <Link
                      href="/dashboard"
                      className="block text-brand/80 hover:text-brand-accent"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                  )}
                  {user.role === "ADMIN" && (
                    <Link
                      href="/admin/users"
                      className="block text-brand/80 hover:text-brand-accent"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin
                    </Link>
                  )}
                  <div onClick={() => setMobileMenuOpen(false)}>
                    <SignOutButton />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
