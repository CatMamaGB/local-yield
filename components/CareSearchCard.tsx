"use client";

/**
 * Central search card for Care: farm/homestead categories + ZIP + radius.
 * Uses CareCategory from lib; URL and UI use category only (no serviceType in URL).
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BuildingStorefrontIcon,
  UserGroupIcon,
  BeakerIcon,
  SunIcon,
  WrenchScrewdriverIcon,
  MoonIcon,
  SparklesIcon,
  CogIcon,
} from "@heroicons/react/24/outline";
import { CARE_CATEGORIES, type CareCategory, type CareCategoryGroup } from "@/lib/care/categories";
import { RADIUS_OPTIONS } from "@/lib/geo/constants";

const CATEGORIES_WITH_ICONS = {
  animalCare: [
    { ...CARE_CATEGORIES.animalCare[0], icon: BuildingStorefrontIcon },
    { ...CARE_CATEGORIES.animalCare[1], icon: UserGroupIcon },
    { ...CARE_CATEGORIES.animalCare[2], icon: BeakerIcon },
  ],
  barnChores: [
    { ...CARE_CATEGORIES.barnChores[0], icon: SunIcon },
    { ...CARE_CATEGORIES.barnChores[1], icon: WrenchScrewdriverIcon },
    { ...CARE_CATEGORIES.barnChores[2], icon: MoonIcon },
  ],
  helpExchange: [
    { ...CARE_CATEGORIES.helpExchange[0], icon: WrenchScrewdriverIcon },
    { ...CARE_CATEGORIES.helpExchange[1], icon: SparklesIcon },
    { ...CARE_CATEGORIES.helpExchange[2], icon: CogIcon },
  ],
} as const;

export function CareSearchCard() {
  const router = useRouter();
  const [activeGroup, setActiveGroup] = useState<CareCategoryGroup>("animalCare");
  const [category, setCategory] = useState<CareCategory>("LIVESTOCK_CARE");
  const [zip, setZip] = useState("");
  const [radius, setRadius] = useState<number>(25);

  const options = CATEGORIES_WITH_ICONS[activeGroup];

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = zip.trim().replace(/\D/g, "").slice(0, 5);
    if (trimmed.length !== 5) return;
    const params = new URLSearchParams({
      zip: trimmed,
      radius: String(radius),
      category,
    });
    router.push(`/care/browse?${params.toString()}`);
  }

  return (
    <div className="w-full max-w-2xl rounded-xl border border-brand/10 bg-white p-6 shadow-farmhouse sm:p-8">
      <form onSubmit={handleSearch} className="space-y-6">
        <div>
          <h2 className="font-display text-lg font-semibold text-brand">
            What do you need help with?
          </h2>
          <p className="mt-1 text-sm text-brand/70">
            Pick a category, enter a ZIP code, then search.
          </p>
        </div>

        {/* Category group tabs */}
        <div className="flex flex-wrap gap-2">
          {(["animalCare", "barnChores", "helpExchange"] as const).map((group) => (
            <button
              key={group}
              type="button"
              onClick={() => {
                setActiveGroup(group);
                setCategory(CARE_CATEGORIES[group][0].id);
              }}
              className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 ${
                activeGroup === group
                  ? "border-brand-accent bg-brand-light text-brand"
                  : "border-brand/20 bg-white text-brand/80 hover:border-brand-accent/40"
              }`}
            >
              {group === "animalCare" && "Animal care"}
              {group === "barnChores" && "Barn and chores"}
              {group === "helpExchange" && "Farm help exchange"}
            </button>
          ))}
        </div>

        {/* Option chips for active group */}
        <div>
          <div className="flex flex-wrap gap-2">
            {options.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setCategory(id)}
                className={`flex items-center gap-2 rounded-lg border-2 px-4 py-3 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 ${
                  category === id
                    ? "border-brand-accent bg-brand-light text-brand"
                    : "border-brand/20 bg-white text-brand/80 hover:border-brand-accent/40"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ZIP + distance row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 sm:items-end">
          <div className="sm:col-span-5">
            <label htmlFor="care-zip" className="sr-only">
              ZIP code
            </label>
            <input
              id="care-zip"
              type="text"
              inputMode="numeric"
              placeholder="Enter ZIP code"
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
              maxLength={5}
              className="w-full rounded-lg border border-brand/20 bg-white px-4 py-3 text-brand placeholder:text-brand/50 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
            />
          </div>
          <div className="sm:col-span-4">
            <label htmlFor="care-distance" className="block text-sm font-medium text-brand mb-1">
              Distance
            </label>
            <select
              id="care-distance"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full rounded-lg border border-brand/20 bg-white px-4 py-3 text-brand focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
            >
              {RADIUS_OPTIONS.map((miles) => (
                <option key={miles} value={miles}>
                  {miles} miles
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-3">
            <button
              type="submit"
              className="w-full rounded-lg bg-brand-accent px-6 py-3 text-sm font-semibold text-white shadow-farmhouse transition hover:bg-brand-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
            >
              Search helpers
            </button>
          </div>
        </div>
        <p className="text-xs text-brand/60">
          We only show local results. No nationwide listings.
        </p>
      </form>
    </div>
  );
}
