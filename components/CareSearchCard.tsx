"use client";

/**
 * Rover-style central search card for Care: service categories + address + Search.
 * Used on /care when Care is enabled. When disabled, Care page shows a "Coming soon" variant.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  HomeIcon,
  UserIcon,
  SunIcon,
  BuildingOffice2Icon,
  BoltIcon,
} from "@heroicons/react/24/outline";

const FOR_WHEN_AWAY = [
  { id: "boarding", label: "Boarding", icon: BuildingOffice2Icon },
  { id: "house-sitting", label: "House Sitting", icon: HomeIcon },
  { id: "drop-in", label: "Drop-In Visits", icon: UserIcon },
] as const;

const FOR_WHEN_AT_WORK = [
  { id: "day-care", label: "Doggy Day Care", icon: SunIcon },
  { id: "dog-walking", label: "Dog Walking", icon: BoltIcon },
] as const;

type ServiceId =
  | (typeof FOR_WHEN_AWAY)[number]["id"]
  | (typeof FOR_WHEN_AT_WORK)[number]["id"];

export function CareSearchCard() {
  const router = useRouter();
  const [service, setService] = useState<ServiceId>("boarding");
  const [address, setAddress] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (address.trim()) params.set("address", address.trim());
    params.set("service", service);
    router.push(`/care/browse?${params.toString()}`);
  }

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-brand/15 bg-white p-6 shadow-xl">
      <form onSubmit={handleSearch} className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand/70">
            For When You&apos;re Away
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {FOR_WHEN_AWAY.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setService(id)}
                className={`flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition ${
                  service === id
                    ? "border-brand bg-brand-light text-brand"
                    : "border-brand/20 bg-white text-brand/80 hover:border-brand/40"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand/70">
            For When You&apos;re At Work
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {FOR_WHEN_AT_WORK.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setService(id)}
                className={`flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition ${
                  service === id
                    ? "border-brand bg-brand-light text-brand"
                    : "border-brand/20 bg-white text-brand/80 hover:border-brand/40"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="care-address" className="sr-only">
            Your address
          </label>
          <input
            id="care-address"
            type="text"
            placeholder="Add your address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-xl border-2 border-brand/20 bg-white px-4 py-3 text-brand placeholder:text-brand/50 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand/90"
        >
          Search
        </button>
      </form>
    </div>
  );
}
