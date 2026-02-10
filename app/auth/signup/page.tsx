/**
 * Signup page. Phase 1: Coming Soon. Wire to Clerk or Supabase when adding auth.
 */

import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-light px-4">
      <div className="w-full max-w-sm rounded-xl border border-brand/20 bg-white p-8 shadow-sm">
        <h1 className="font-display text-2xl font-semibold text-brand">
          Create account
        </h1>
        <p className="mt-3 text-sm text-brand/80">
          Registration isn’t set up yet. We’re focusing on browsing and listing first.
        </p>
        <p className="mt-2 text-sm font-medium text-brand">
          Coming Soon
        </p>
        <p className="mt-4 text-xs text-brand/60">
          Auth will be added when producers need to post products and buyers need to save info.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/market/browse"
            className="rounded bg-brand py-2.5 text-center font-medium text-white hover:bg-brand/90"
          >
            Browse local goods
          </Link>
          <Link
            href="/auth/login"
            className="text-center text-sm text-brand-accent hover:underline"
          >
            Already have an account? Log in (coming soon)
          </Link>
        </div>
      </div>
    </div>
  );
}
