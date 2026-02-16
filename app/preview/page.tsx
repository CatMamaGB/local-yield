/**
 * Preview entry — public page. Name + email + passphrase to enter private preview.
 * When PREVIEW_MODE=true, proxy allows this path without cookie.
 */

"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function safeRedirectPath(next: string): boolean {
  if (!next || next.startsWith("//") || next.includes(":")) return false;
  if (!next.startsWith("/")) return false;
  return true;
}

function PreviewEntryForm() {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next") ?? "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/preview/enter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          passphrase,
          next: nextParam || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong.");
        setSubmitting(false);
        return;
      }
      const redirect = data?.redirect ?? "/market";
      const to = safeRedirectPath(redirect) ? redirect : "/market";
      window.location.href = to;
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-light">
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 id="preview-heading" className="font-display text-3xl font-bold tracking-tight text-brand">
          Enter private preview
        </h1>
        <p className="mt-2 text-brand/80 text-sm" id="preview-desc">
          Provide your name, email, and the preview passphrase you were given to access the app.
        </p>
        <p className="mt-2 text-brand/70 text-xs" role="note">
          Preview access is logged (name, email, pages viewed) for product feedback and security.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5 rounded-xl border border-brand/10 bg-white p-6 shadow-farmhouse"
          aria-labelledby="preview-heading"
          aria-describedby="preview-desc"
          noValidate
        >
          {error && (
            <div
              className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {error}
            </div>
          )}
          <div>
            <label htmlFor="preview-name" className="block text-sm font-medium text-brand">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="preview-name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-brand/20 bg-white px-3 py-2 text-brand shadow-sm focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="preview-email" className="block text-sm font-medium text-brand">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="preview-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-brand/20 bg-white px-3 py-2 text-brand shadow-sm focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="preview-passphrase" className="block text-sm font-medium text-brand">
              Passphrase <span className="text-red-500">*</span>
            </label>
            <input
              id="preview-passphrase"
              type="password"
              required
              autoComplete="off"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-brand/20 bg-white px-3 py-2 text-brand shadow-sm focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
              disabled={submitting}
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex justify-center rounded-lg bg-brand px-4 py-2.5 text-base font-semibold text-white shadow-farmhouse transition hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {submitting ? "Entering…" : "Enter preview"}
            </button>
            <Link
              href="/"
              className="text-center text-sm font-medium text-brand-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 rounded"
            >
              Back to home
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function PreviewEntryPage() {
  return (
    <Suspense fallback={<PreviewEntryFallback />}>
      <PreviewEntryForm />
    </Suspense>
  );
}

function PreviewEntryFallback() {
  return (
    <div className="min-h-screen bg-brand-light">
      <main className="mx-auto max-w-md px-4 py-12">
        <div className="font-display text-2xl font-semibold text-brand">Enter private preview</div>
        <p className="mt-4 text-brand/80">Loading…</p>
      </main>
    </div>
  );
}
