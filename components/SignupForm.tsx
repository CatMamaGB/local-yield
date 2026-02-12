"use client";

/**
 * Full signup form: identity + contact + location + roles + primaryMode.
 * POSTs to /api/auth/signup; redirects to /auth/onboarding on success.
 */

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RoleSelection, type SignUpRoleId } from "./RoleSelection";
import { ZipCodeInput } from "./ZipCodeInput";

const PRIMARY_MODES: { value: "MARKET" | "SELL" | "CARE"; label: string }[] = [
  { value: "MARKET", label: "MARKET (browse & buy)" },
  { value: "SELL", label: "SELL (manage products & orders)" },
  { value: "CARE", label: "CARE (caregiving & hiring)" },
];

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [roles, setRoles] = useState<SignUpRoleId[]>(["BUYER"]);
  const [primaryMode, setPrimaryMode] = useState<"MARKET" | "SELL" | "CARE">("MARKET");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowedModes = useMemo(() => {
    const hasProducer = roles.includes("PRODUCER");
    const hasCare = roles.includes("CAREGIVER") || roles.includes("CARE_SEEKER");
    const modes: ("MARKET" | "SELL" | "CARE")[] = ["MARKET"];
    if (hasProducer) modes.push("SELL");
    if (hasCare) modes.push("CARE");
    return modes;
  }, [roles]);

  const effectivePrimaryMode = allowedModes.includes(primaryMode) ? primaryMode : allowedModes[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const zip = zipCode.trim().slice(0, 5);
    if (!/^\d{5}$/.test(zip)) {
      setError("Enter a valid 5-digit ZIP code.");
      return;
    }
    if (roles.length === 0) {
      setError("Select at least one role.");
      return;
    }
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!phone.trim()) {
      setError("Phone is required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          zipCode: zip,
          roles,
          primaryMode: effectivePrimaryMode,
          addressLine1: addressLine1.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Sign up failed");
      if (data.redirect) {
        router.push(data.redirect);
        router.refresh();
        return;
      }
      router.push("/auth/onboarding");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-lg rounded-xl border border-brand/20 bg-white p-8 shadow-sm">
      <h1 className="font-display text-2xl font-semibold text-brand">Create account</h1>
      <p className="mt-2 text-sm text-brand/80">
        Create your customer profile. You can select multiple roles.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="signup-name" className="block text-sm font-medium text-brand">Name *</label>
          <input
            id="signup-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded border border-brand/20 px-3 py-2 text-brand"
            required
          />
        </div>
        <div>
          <label htmlFor="signup-email" className="block text-sm font-medium text-brand">Email *</label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border border-brand/20 px-3 py-2 text-brand"
            required
          />
        </div>
        <div>
          <label htmlFor="signup-phone" className="block text-sm font-medium text-brand">Phone *</label>
          <input
            id="signup-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded border border-brand/20 px-3 py-2 text-brand"
            required
          />
        </div>
        <ZipCodeInput value={zipCode} onChange={setZipCode} required />

        <RoleSelection value={roles} onChange={setRoles} />
        <div>
          <p className="block text-sm font-medium text-brand">Primary mode *</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {PRIMARY_MODES.map((m) => {
              const enabled = allowedModes.includes(m.value);
              return (
                <label
                  key={m.value}
                  className={`flex items-center gap-2 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
                >
                  <input
                    type="radio"
                    name="primaryMode"
                    value={m.value}
                    checked={effectivePrimaryMode === m.value}
                    onChange={() => enabled && setPrimaryMode(m.value)}
                    disabled={!enabled}
                    className="h-4 w-4 border-brand text-brand"
                  />
                  <span className="text-sm text-brand">{m.label}</span>
                </label>
              );
            })}
          </div>
          <p className="mt-1 text-xs text-brand/70">SELL requires Producer role. CARE requires Caregiver or Care Seeker.</p>
        </div>

        <details className="text-sm">
          <summary className="cursor-pointer font-medium text-brand/80">Optional: address</summary>
          <div className="mt-2 space-y-2 pl-2">
            <input
              type="text"
              placeholder="Address line 1"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              className="w-full rounded border border-brand/20 px-3 py-2 text-brand"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="rounded border border-brand/20 px-3 py-2 text-brand"
              />
              <input
                type="text"
                placeholder="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="rounded border border-brand/20 px-3 py-2 text-brand"
              />
            </div>
          </div>
        </details>

        {error && (
          <p className="text-sm text-red-600" role="alert">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading || roles.length === 0}
          className="w-full rounded bg-brand py-2.5 font-medium text-white hover:bg-brand/90 disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Continue"}
        </button>
      </form>
      <div className="mt-6 flex flex-col gap-2 text-center">
        <Link href="/auth/login" className="text-sm text-brand-accent hover:underline">
          Already have an account? Sign in
        </Link>
        <Link href="/market/browse" className="text-sm text-brand/70 hover:underline">
          Browse without signing in
        </Link>
      </div>
    </div>
  );
}
