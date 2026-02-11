"use client";

/**
 * AuthForm — provider-driven. When Clerk is not configured, shows dev stub: pick role and sign in/sign up (sets cookie).
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RolePicker } from "./RolePicker";

type Mode = "sign-in" | "sign-up";
type DevRole = "BUYER" | "PRODUCER" | "ADMIN";

export interface AuthFormProps {
  mode: Mode;
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [role, setRole] = useState<DevRole | null>(mode === "sign-up" ? null : "BUYER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const r = role ?? "BUYER";
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: r }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Sign in failed");
      }
      const data = await res.json();
      if (data.redirect) {
        router.push(data.redirect);
        return;
      }
      router.push(mode === "sign-up" ? "/auth/onboarding" : "/auth/onboarding");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-brand/20 bg-white p-8 shadow-sm">
      <h1 className="font-display text-2xl font-semibold text-brand">
        {mode === "sign-in" ? "Sign in" : "Create account"}
      </h1>
      <p className="mt-2 text-sm text-brand/80">
        {mode === "sign-in"
          ? "Choose a role to sign in (development mode)."
          : "Choose how you’ll use the platform (development mode)."}
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {mode === "sign-in" ? (
          <div>
            <span className="block text-sm font-medium text-brand">Sign in as</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["BUYER", "PRODUCER", "ADMIN"] as const).map((r) => (
                <label key={r} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="devRole"
                    value={r}
                    checked={role === r}
                    onChange={() => setRole(r)}
                    className="h-4 w-4 border-brand text-brand"
                  />
                  <span className="text-sm text-brand">{r}</span>
                </label>
              ))}
            </div>
          </div>
        ) : (
          <RolePicker
            value={role === "ADMIN" ? "BUYER" : role}
            onChange={(r) => setRole(r)}
          />
        )}
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
          {loading ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Continue"}
        </button>
      </form>
      <div className="mt-6 flex flex-col gap-2 text-center">
        {mode === "sign-in" ? (
          <Link href="/auth/signup" className="text-sm text-brand-accent hover:underline">
            Create an account
          </Link>
        ) : (
          <Link href="/auth/login" className="text-sm text-brand-accent hover:underline">
            Already have an account? Sign in
          </Link>
        )}
        <Link href="/market/browse" className="text-sm text-brand/70 hover:underline">
          Browse without signing in
        </Link>
      </div>
    </div>
  );
}
