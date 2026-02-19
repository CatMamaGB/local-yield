"use client";

/**
 * AuthForm — provider-driven. When Clerk is not configured, shows dev stub: pick role and sign in/sign up (sets cookie).
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SignupForm } from "./SignupForm";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { apiPost } from "@/lib/client/api-client";
import { formatApiError } from "@/lib/client/error-format";

type Mode = "sign-in" | "sign-up";
type DevRole = "BUYER" | "PRODUCER" | "ADMIN";

export interface AuthFormProps {
  mode: Mode;
  /** Safe internal path for post-login redirect (e.g. from next=). */
  requestedUrl?: string | null;
}

export function AuthForm({ mode, requestedUrl }: AuthFormProps) {
  const router = useRouter();
  const [role, setRole] = useState<DevRole | null>(mode === "sign-up" ? null : "BUYER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorRequestId, setErrorRequestId] = useState<string | null>(null);

  if (mode === "sign-up") {
    return <SignupForm requestedUrl={requestedUrl} />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setErrorRequestId(null);
    try {
      const r = role ?? "BUYER";
      const url = requestedUrl
        ? `/api/auth/dev-login?next=${encodeURIComponent(requestedUrl)}`
        : "/api/auth/dev-login";
      const data = await apiPost<{ redirect?: string }>(url, { role: r });
      if (data?.redirect) {
        router.push(data.redirect);
        router.refresh();
        return;
      }
      router.push("/auth/onboarding");
      router.refresh();
    } catch (err) {
      const { message, requestId } = formatApiError(err);
      setError(message);
      setErrorRequestId(requestId ?? null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-xl border border-brand/10 bg-white p-8 shadow-farmhouse">
      <h1 className="font-display text-2xl font-semibold text-brand leading-tight">
        Sign in
      </h1>
      <p className="mt-2 text-sm text-brand/80 leading-relaxed">
        Choose a role to sign in (development mode).
      </p>
      <p className="mt-1 text-xs text-brand/60">
        Password reset is available only when Clerk is enabled (staging/prod).
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <span className="block text-sm font-medium text-brand mb-1.5">Sign in as</span>
          <div className="flex flex-wrap gap-3">
            {(["BUYER", "PRODUCER", "ADMIN"] as const).map((r) => (
              <label key={r} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="devRole"
                  value={r}
                  checked={role === r}
                  onChange={() => setRole(r)}
                  className="h-4 w-4 border-brand-accent text-brand-accent focus:ring-brand-accent"
                />
                <span className="text-sm text-brand">{r}</span>
              </label>
            ))}
          </div>
        </div>
        {error && (
          <InlineAlert variant="error" title="Sign-in failed">
            {error}
            {errorRequestId && (
              <p className="mt-1 text-xs opacity-80">Request ID: {errorRequestId}</p>
            )}
          </InlineAlert>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-accent py-2.5 text-sm font-medium text-white shadow-farmhouse transition hover:bg-brand-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 disabled:opacity-50"
        >
          {loading ? "Please wait…" : "Sign in"}
        </button>
      </form>
      <div className="mt-6 flex flex-col gap-2 text-center">
        <Link href="/auth/signup" className="text-sm text-brand-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 rounded">
          Create an account
        </Link>
        <Link href="/market" className="text-sm text-brand/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 rounded">
          Browse without signing in
        </Link>
      </div>
    </div>
  );
}
