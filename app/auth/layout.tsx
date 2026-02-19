/**
 * Auth layout: minimal chrome so users can go back.
 * Shows AuthPageHeader (logo, Browse without signing in, Sign in / Create account) on all auth pages.
 * Main navbar and footer remain hidden for /auth via HIDE_CHROME_ROUTES.
 */

import { AuthPageHeader } from "@/components/AuthPageHeader";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-brand-light">
      <AuthPageHeader />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {children}
      </main>
    </div>
  );
}
