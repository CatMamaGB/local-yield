"use client";

/**
 * Rover-style central card for Market: clear Find (buyer) vs Sell (producer) paths.
 * Find: address input + Browse. Sell: CTA to sign up or dashboard.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon, TagIcon, Squares2X2Icon } from "@heroicons/react/24/outline";

interface MarketSearchCardProps {
  /** When true, show "Go to Dashboard" instead of "Sign up to sell" */
  isProducer?: boolean;
}

export function MarketSearchCard({ isProducer }: MarketSearchCardProps) {
  const router = useRouter();
  const [address, setAddress] = useState("");

  function handleFind(e: React.FormEvent) {
    e.preventDefault();
    const zip = address.trim().replace(/\D/g, "").slice(0, 5);
    if (zip.length === 5) {
      router.push(`/market/browse?zip=${zip}`);
    } else {
      router.push("/market/browse");
    }
  }

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-brand/15 bg-white p-6 shadow-xl">
      <div className="space-y-6">
        {/* Find local goods — primary buyer path */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand/70">
            Find local goods
          </p>
          <form onSubmit={handleFind} className="mt-3 flex flex-col gap-3 sm:flex-row">
            <label htmlFor="market-address" className="sr-only">
              Your address or ZIP
            </label>
            <input
              id="market-address"
              type="text"
              placeholder="Add your address or ZIP"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="flex-1 rounded-xl border-2 border-brand/20 bg-white px-4 py-3 text-brand placeholder:text-brand/50 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand/90"
            >
              <MagnifyingGlassIcon className="h-5 w-5" aria-hidden />
              Browse
            </button>
          </form>
        </div>

        {/* Sell your products — producer path, pain-led */}
        <div className="border-t border-brand/15 pt-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand/70">
            Sell your products
          </p>
          <p className="mt-2 text-brand/80">
            Sell without booth fees or full-day commitment. One place for online and in-person — keep more of what you earn.
          </p>
          {isProducer ? (
            <Link
              href="/dashboard"
              className="mt-4 inline-flex items-center gap-2 rounded-xl border-2 border-brand px-5 py-2.5 font-medium text-brand transition hover:bg-brand/10"
            >
              <Squares2X2Icon className="h-5 w-5" aria-hidden />
              Go to Dashboard
            </Link>
          ) : (
            <Link
              href="/auth/signup"
              className="mt-4 inline-flex items-center gap-2 rounded-xl border-2 border-brand px-5 py-2.5 font-medium text-brand transition hover:bg-brand/10"
            >
              <TagIcon className="h-5 w-5" aria-hidden />
              Sign up to sell
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
