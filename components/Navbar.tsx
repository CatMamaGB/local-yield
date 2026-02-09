"use client";

/**
 * Main navigation for The Local Yield.
 */

import Link from "next/link";
import Image from "next/image";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-brand/20 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-semibold text-brand">
          <Image src="/local-yield-logo.png" alt="Local Yield" width={32} height={32} />
          The Local Yield
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/browse" className="text-brand hover:text-brand-accent">
            Browse
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
        </div>
      </nav>
    </header>
  );
}
