/**
 * Signup: Clerk SignUp when configured; otherwise dev AuthForm (role picker → onboarding).
 * Supports ?next= for post-signup redirect (passed to onboarding).
 */

import { SignUp } from "@clerk/nextjs";
import { AuthForm } from "@/components/AuthForm";
import { sanitizeNextPath } from "@/lib/redirects";

const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
);

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const rawNext = (await searchParams).next;
  const requestedUrl = sanitizeNextPath(rawNext);
  const afterSignUpUrl = requestedUrl
    ? `/auth/onboarding?from=signup&next=${encodeURIComponent(requestedUrl)}`
    : "/auth/onboarding?from=signup";

  if (clerkConfigured) {
    return (
      <div className="w-full max-w-md">
        <SignUp
          appearance={{
            variables: { colorPrimary: "#5D4524" },
          }}
          afterSignUpUrl={afterSignUpUrl}
          signInUrl={requestedUrl ? `/auth/login?next=${encodeURIComponent(requestedUrl)}` : "/auth/login"}
        />
      </div>
    );
  }

  return <AuthForm mode="sign-up" requestedUrl={requestedUrl ?? null} />;
}
