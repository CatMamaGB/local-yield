"use client";

/**
 * Main navigation: brand + global actions only. Navbar is dumb; layouts are smart.
 * Only derives: inApp, showMarketNav, showModeSwitcher, showCart (from capabilities).
 * No raw user fields; no isBuyerOnly / isProducerOnly / isCareOnly.
 */

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { CartLink } from "@/components/market/CartLink";
import { SignOutButton } from "@/components/SignOutButton";
import { NotificationBell } from "@/components/NotificationBell";
import { getUserCapabilities } from "@/lib/authz/client";
import { isAppArea } from "@/lib/nav-routes";
import { apiPatch } from "@/lib/client/api-client";
import type { SessionUser } from "@/lib/auth/types";

interface NavbarProps {
  user: SessionUser | null;
}

export function Navbar({ user }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const pathname = usePathname();
  const caps = getUserCapabilities(user);
  const inApp = isAppArea(pathname);

  const showMarketNav = !inApp;
  const showModeSwitcher = caps.isMultiMode;
  const showCart = showMarketNav && user && !caps.canSell;

  async function setPrimaryMode(mode: "MARKET" | "SELL" | "CARE") {
    try {
      await apiPatch("/api/auth/primary-mode", { primaryMode: mode });
    } catch {
      // best effort; mode switch still navigates
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-brand/10 bg-white/95 backdrop-blur shadow-farmhouse">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-semibold text-brand">
          <Image src="/local-yield-logo.png" alt="Local Yield" width={32} height={32} />
          <span className="hidden sm:inline">The Local Yield</span>
          <span className="sm:hidden">Local Yield</span>
        </Link>

        {/* Desktop nav: public primary actions — Browse, Care, About, Cart */}
        {showMarketNav && (
          <div className="hidden md:flex items-center gap-5">
            <Link href="/market" className="font-medium text-brand hover:text-brand-accent">
              Browse
            </Link>
            <Link
              href="/care"
              className={`font-medium transition ${pathname.startsWith("/care") ? "text-brand-accent" : "text-brand/80 hover:text-brand-accent"}`}
            >
              Care
            </Link>
            <Link href="/about" className="text-brand/80 hover:text-brand-accent">
              About
            </Link>
            {showCart && <CartLink />}
          </div>
        )}
        
        {/* Desktop nav: account — dropdown when logged in (Switch mode only when isMultiMode) */}
        <div className="hidden md:flex items-center gap-4">
          {!user ? (
            <>
              <Link href="/auth/login" className="text-brand hover:text-brand-accent">
                Sign in
              </Link>
              <Link href="/auth/signup" className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-white shadow-farmhouse transition hover:bg-brand-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2">
                Sign up
              </Link>
            </>
          ) : (
            <>
              <NotificationBell />
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="rounded-lg border border-brand/20 bg-white px-3 py-2 text-sm font-medium text-brand hover:bg-brand-light/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="true"
                >
                  Account
                </button>
                {accountMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" aria-hidden onClick={() => setAccountMenuOpen(false)} />
                    <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-xl border border-brand/20 bg-white py-2 shadow-farmhouse">
                      {showModeSwitcher && (
                        <div className="border-b border-brand/10 px-3 pb-2 mb-2">
                          <p className="text-xs font-medium text-brand/70 px-2 py-1">Switch mode</p>
                          <Link href="/market" onClick={() => { setPrimaryMode("MARKET"); setAccountMenuOpen(false); }} className="block rounded-md px-3 py-1.5 text-sm text-brand hover:bg-brand-light/50">Market</Link>
                          {caps.canSell && <Link href="/dashboard" onClick={() => { setPrimaryMode("SELL"); setAccountMenuOpen(false); }} className="block rounded-md px-3 py-1.5 text-sm text-brand hover:bg-brand-light/50">Sell</Link>}
                          {caps.canCare && <Link href="/care" onClick={() => { setPrimaryMode("CARE"); setAccountMenuOpen(false); }} className="block rounded-md px-3 py-1.5 text-sm text-brand hover:bg-brand-light/50">Care</Link>}
                        </div>
                      )}
                      <Link href="/dashboard/profile" onClick={() => setAccountMenuOpen(false)} className="block px-4 py-2 text-sm text-brand hover:bg-brand-light/50">Profile</Link>
                      {caps.canAdmin && <Link href="/admin" onClick={() => setAccountMenuOpen(false)} className="block px-4 py-2 text-sm text-brand hover:bg-brand-light/50">Admin</Link>}
                      <div className="border-t border-brand/10 mt-2 pt-2" onClick={() => setAccountMenuOpen(false)}>
                        <SignOutButton />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Mobile: cart (market only) + menu button */}
        <div className="flex md:hidden items-center gap-3">
          {showCart && <CartLink />}
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
                {caps.canSell && (
                  <Link href="/dashboard" onClick={() => { setPrimaryMode("SELL"); setMobileMenuOpen(false); }} className="rounded-md px-3 py-2 text-sm font-medium bg-brand-light/50 text-brand">
                    Sell
                  </Link>
                )}
                {caps.canCare && (
                  <Link href="/care" onClick={() => { setPrimaryMode("CARE"); setMobileMenuOpen(false); }} className="rounded-md px-3 py-2 text-sm font-medium bg-brand-light/50 text-brand">
                    Care
                  </Link>
                )}
              </div>
            )}
            {showMarketNav && (
              <>
                <Link
                  href="/market"
                  className="block font-medium text-brand hover:text-brand-accent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Browse
                </Link>
                <Link
                  href="/care"
                  className={`block font-medium transition ${pathname.startsWith("/care") ? "text-brand-accent" : "text-brand/80 hover:text-brand-accent"}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Care
                </Link>
                <Link
                  href="/about"
                  className="block text-brand/80 hover:text-brand-accent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About
                </Link>
                {showCart && (
                  <div onClick={() => setMobileMenuOpen(false)}>
                    <CartLink />
                  </div>
                )}
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
                    className="block rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-white text-center shadow-farmhouse transition hover:bg-brand-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign up
                  </Link>
                </>
              ) : (
                <>
                  {caps.canAdmin ? (
                    <Link
                      href="/admin"
                      className="block text-brand/80 hover:text-brand-accent"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin
                    </Link>
                  ) : (
                    <Link
                      href="/dashboard"
                      className="block text-brand/80 hover:text-brand-accent"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
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
