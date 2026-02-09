/**
 * Login page. Wire to Clerk or Supabase Auth.
 */

import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-light px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-md">
        <h1 className="font-display text-2xl font-semibold text-brand">Log in</h1>
        <p className="mt-2 text-sm text-brand/80">
          Auth not yet connected. Use Clerk or Supabase.
        </p>
        <div className="mt-6 space-y-3">
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded border border-brand/30 px-3 py-2 text-brand"
            disabled
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full rounded border border-brand/30 px-3 py-2 text-brand"
            disabled
          />
          <button
            type="button"
            className="w-full rounded bg-brand py-2 text-white hover:bg-brand/90"
            disabled
          >
            Sign in (coming soon)
          </button>
        </div>
        <p className="mt-4 text-center text-sm text-brand/80">
          <Link href="/auth/signup" className="text-brand-accent hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
