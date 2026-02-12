"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ZipCodeInput } from "@/components/ZipCodeInput";
import { RoleSelection, type SignUpRoleId } from "@/components/RoleSelection";

export type PrimaryMode = "MARKET" | "SELL" | "CARE";

const PRIMARY_MODES: { value: PrimaryMode; label: string; description: string }[] = [
  { value: "MARKET", label: "Market", description: "Browse & buy from local producers" },
  { value: "SELL", label: "Sell", description: "Use your dashboard to sell" },
  { value: "CARE", label: "Care", description: "Offer or find animal care" },
];

export function OnboardingClient() {
  const router = useRouter();
  const [zip, setZip] = useState("");
  const [roles, setRoles] = useState<SignUpRoleId[]>(["BUYER"]);
  const [primaryMode, setPrimaryMode] = useState<PrimaryMode>("MARKET");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowedModes = useMemo(() => {
    const hasBuyer = roles.includes("BUYER");
    const hasProducer = roles.includes("PRODUCER");
    const hasCare = roles.includes("CAREGIVER") || roles.includes("CARE_SEEKER");
    const modes: PrimaryMode[] = [];
    if (hasBuyer || !hasProducer) modes.push("MARKET");
    if (hasProducer) modes.push("SELL");
    if (hasCare) modes.push("CARE");
    return modes.length ? modes : (["MARKET"] as PrimaryMode[]);
  }, [roles]);

  const effectivePrimaryMode = allowedModes.includes(primaryMode) ? primaryMode : allowedModes[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = zip.trim().slice(0, 5);
    if (!/^\d{5}$/.test(trimmed)) {
      setError("Enter a valid 5-digit ZIP code.");
      return;
    }
    if (roles.length === 0) {
      setError("Select at least one role.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zipCode: trimmed,
          roles,
          primaryMode: effectivePrimaryMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      if (data.redirect) {
        router.push(data.redirect);
        router.refresh();
        return;
      }
      router.push("/market");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-brand/20 bg-white p-8 shadow-sm">
      <h1 className="font-display text-2xl font-semibold text-brand">Almost there</h1>
      <p className="mt-2 text-sm text-brand/80">
        Set your roles and location so we can show you relevant features and nearby producers.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <RoleSelection value={roles} onChange={setRoles} />
        <div>
          <p className="mb-2 block text-sm font-medium text-brand">What do you want to do most often?</p>
          <div className="space-y-2">
            {PRIMARY_MODES.filter((m) => allowedModes.includes(m.value)).map((mode) => (
              <label
                key={mode.value}
                className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-brand/30 bg-white px-4 py-3 transition has-[:checked]:border-brand has-[:checked]:bg-brand-light/50"
              >
                <input
                  type="radio"
                  name="primaryMode"
                  value={mode.value}
                  checked={effectivePrimaryMode === mode.value}
                  onChange={() => setPrimaryMode(mode.value)}
                  className="mt-1 h-4 w-4 shrink-0 border-brand text-brand focus:ring-brand"
                />
                <div>
                  <span className="font-medium text-brand">{mode.label}</span>
                  <p className="mt-0.5 text-sm text-brand/80">{mode.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
        <ZipCodeInput value={zip} onChange={setZip} required />
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-brand py-2.5 font-medium text-white hover:bg-brand/90 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Continue"}
        </button>
      </form>
    </div>
  );
}
