/**
 * Login: Clerk SignIn when configured; otherwise dev AuthForm.
 * Respects next= for post-login redirect (validated safe path).
 */

import { SignIn } from "@clerk/nextjs";
import { AuthForm } from "@/components/AuthForm";
import { sanitizeNextPath } from "@/lib/redirects";

const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
);

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; auth?: string }>;
}) {
  const params = await searchParams;
  const rawNext = params.next;
  const requestedUrl = sanitizeNextPath(rawNext);
  const afterSignInUrl = requestedUrl
    ? `/auth/onboarding?from=login&next=${encodeURIComponent(requestedUrl)}`
    : "/auth/onboarding?from=login";

  const forceDevAuth = process.env.NODE_ENV !== "production" && params.auth === "dev";
  const showClerk = clerkConfigured && !forceDevAuth;

  if (showClerk) {
    return (
      <div className="w-full max-w-md space-y-4">
        <SignIn
          appearance={{
            variables: { colorPrimary: "#5D4524" },
          }}
          afterSignInUrl={afterSignInUrl}
          signUpUrl="/auth/signup"
        />
        <p className="text-center text-sm text-brand/80">
          Forgot your password? Use the link above to reset it.
        </p>
      </div>
    );
  }

  return <AuthForm mode="sign-in" requestedUrl={requestedUrl ?? null} />;
}
