"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ZipCodeInput } from "@/components/ZipCodeInput";
import { RoleSelection, type SignUpRoleId } from "@/components/RoleSelection";
import { apiPost } from "@/lib/client/api-client";
import { ApiError, apiErrorMessage } from "@/lib/client/api-client";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { sanitizeNextPath } from "@/lib/redirects";
import { logTelemetry } from "@/lib/telemetry/telemetry";

export type PrimaryMode = "MARKET" | "SELL" | "CARE";

const PRIMARY_MODES: { value: PrimaryMode; label: string; description: string }[] = [
  { value: "MARKET", label: "Market", description: "Browse & buy from local producers" },
  { value: "SELL", label: "Sell", description: "Use your dashboard to sell" },
  { value: "CARE", label: "Care", description: "Offer or find animal care" },
];

export function OnboardingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next");
  const requestedUrl = sanitizeNextPath(rawNext);
  const from = searchParams.get("from"); // "login" | "signup" — where user came from for smart Back link
  const backHref =
    from === "signup"
      ? requestedUrl
        ? `/auth/signup?next=${encodeURIComponent(requestedUrl)}`
        : "/auth/signup"
      : from === "login"
        ? requestedUrl
          ? `/auth/login?next=${encodeURIComponent(requestedUrl)}`
          : "/auth/login"
        : "/auth/login";
  const [zip, setZip] = useState("");

  useEffect(() => {
    logTelemetry({
      event: "onboarding_started",
      ...(from === "login" || from === "signup" ? { from } : {}),
    });
  }, [from]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [roles, setRoles] = useState<SignUpRoleId[]>([]);
  const [primaryMode, setPrimaryMode] = useState<PrimaryMode>("MARKET");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowedModes = useMemo(() => {
    const hasBuyer = roles.includes("BUYER");
    const hasProducer = roles.includes("PRODUCER");
    const hasCare = roles.includes("CAREGIVER") || roles.includes("CARE_SEEKER");
    const modes: PrimaryMode[] = ["MARKET"];
    if (hasProducer) modes.push("SELL");
    if (hasCare) modes.push("CARE");
    return modes;
  }, [roles]);

  const effectivePrimaryMode = allowedModes.includes(primaryMode) ? primaryMode : allowedModes[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!termsAccepted) {
      setError("You must accept the Terms of Use to continue.");
      return;
    }
    const trimmed = zip.trim().slice(0, 5);
    const hasValidZip = /^\d{5}$/.test(trimmed);
    setLoading(true);
    setError(null);
    try {
      const data = await apiPost<{ redirect?: string }>("/api/auth/onboarding", {
        termsAccepted: true,
        zipCode: hasValidZip ? trimmed : undefined,
        roles: roles.length > 0 ? roles : undefined,
        primaryMode: effectivePrimaryMode,
        ...(requestedUrl ? { requestedUrl } : {}),
      });
      logTelemetry({
        event: "onboarding_completed",
        primaryMode: effectivePrimaryMode,
        hasZip: hasValidZip,
        rolesCount: roles.length,
      });
      if (data?.redirect) {
        router.push(data.redirect);
        router.refresh();
        return;
      }
      router.push("/market/browse");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? apiErrorMessage(err) : (err instanceof Error ? err.message : "Something went wrong"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-brand/20 bg-white p-8 shadow-sm">
      <h1 className="font-display text-2xl font-semibold text-brand">Almost there</h1>
      <p className="mt-2 text-sm text-brand/80">
        Set your preferences. You can add selling or help later in Settings.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <RoleSelection value={roles} onChange={setRoles} />
        <div>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-brand text-brand focus:ring-brand"
            />
            <span className="text-sm text-brand">
              I accept the{" "}
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-brand-accent underline">
                Terms of Use
              </a>{" "}
              and{" "}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-medium text-brand-accent underline">
                Privacy Policy
              </a>.
            </span>
          </label>
          <p className="mt-1.5 text-xs text-brand/70">
            You can finish setting up Seller/Care later in Settings.
          </p>
        </div>
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
        <div>
          <ZipCodeInput value={zip} onChange={setZip} placeholder="ZIP (optional)" />
          <p className="mt-1 text-xs text-brand/70">Add later in Settings to see results near you.</p>
        </div>
        {error && (
          <InlineAlert variant="error" role="alert">
            {error}
          </InlineAlert>
        )}
        <div className="flex flex-col gap-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-brand py-2.5 font-medium text-white hover:bg-brand/90 disabled:opacity-50"
          >
            {loading ? "Saving…" : "Continue"}
          </button>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <Link
              href={backHref}
              className="text-brand/80 hover:text-brand-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 rounded"
            >
              Back
            </Link>
            <Link
              href={requestedUrl ? `/api/auth/post-login-redirect?next=${encodeURIComponent(requestedUrl)}` : "/api/auth/post-login-redirect"}
              className="text-brand/80 hover:text-brand-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 rounded"
            >
              Save & finish later
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
