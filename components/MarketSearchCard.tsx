"use client";

/**
 * Primary search card for Market: buyer-focused browse by location.
 * Used on Market landing; producer CTA lives in a separate section on the page.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export function MarketSearchCard() {
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
    <div className="w-full rounded-xl border border-brand/10 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="font-display text-xl font-semibold text-brand leading-tight">
        Browse nearby
      </h2>
      <form onSubmit={handleFind} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <label htmlFor="market-address" className="sr-only">
          ZIP code or address
        </label>
        <input
          id="market-address"
          type="text"
          placeholder="ZIP code or address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="flex-1 rounded-lg border border-brand/20 bg-white px-4 py-3 text-brand placeholder:text-brand/50 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
        />
        <button
          type="submit"
          className="flex items-center justify-center gap-2 rounded-lg bg-brand-accent px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
        >
          <MagnifyingGlassIcon className="h-5 w-5" aria-hidden />
          Browse nearby
        </button>
      </form>
      <p className="mt-3 text-sm text-brand/80">
        Adjust your search radius anytime.
      </p>
    </div>
  );
}
