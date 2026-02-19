"use client";

/**
 * Minimal header for auth pages (signup, login, onboarding).
 * Gives users a way back: logo → home, "Browse without signing in", and Sign in / Create account.
 */

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export function AuthPageHeader() {
  const pathname = usePathname() ?? "";
  const isSignup = pathname.startsWith("/auth/signup");
  const isLogin = pathname.startsWith("/auth/login");

  return (
    <header className="sticky top-0 z-50 border-b border-brand/10 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-xl font-semibold text-brand hover:text-brand-accent transition"
          aria-label="Back to home"
        >
          <Image src="/local-yield-logo.png" alt="" width={32} height={32} />
          <span className="hidden sm:inline">The Local Yield</span>
          <span className="sm:hidden">Local Yield</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/market"
            className="text-sm font-medium text-brand/80 hover:text-brand-accent transition"
          >
            Browse without signing in
          </Link>
          {isSignup && (
            <Link
              href="/auth/login"
              className="rounded-lg border border-brand/20 bg-white px-4 py-2 text-sm font-medium text-brand hover:bg-brand-light transition"
            >
              Sign in
            </Link>
          )}
          {isLogin && (
            <Link
              href="/auth/signup"
              className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-white hover:bg-brand-accent/90 transition"
            >
              Create account
            </Link>
          )}
          {pathname.startsWith("/auth/onboarding") && (
            <>
              <Link
                href="/auth/login"
                className="text-sm font-medium text-brand/80 hover:text-brand-accent transition"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-lg border border-brand/20 bg-white px-4 py-2 text-sm font-medium text-brand hover:bg-brand-light transition"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
