"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ZipCodeInput } from "@/components/ZipCodeInput";

export function OnboardingClient() {
  const router = useRouter();
  const [zip, setZip] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = zip.trim().slice(0, 5);
    if (!/^\d{5}$/.test(trimmed)) {
      setError("Enter a valid 5-digit ZIP code.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zipCode: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      if (data.redirect) {
        router.push(data.redirect);
        router.refresh();
        return;
      }
      router.push("/market/browse");
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
        Set your location so we can show you nearby producers and distance.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
