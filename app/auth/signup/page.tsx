/**
 * Signup: Clerk SignUp when configured; otherwise dev AuthForm (role picker → onboarding).
 */

import { SignUp } from "@clerk/nextjs";
import { AuthForm } from "@/components/AuthForm";

const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
);

export default function SignupPage() {
  if (clerkConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-light px-4">
        <SignUp
          appearance={{
            variables: { colorPrimary: "#5D4524" },
          }}
          afterSignUpUrl="/auth/onboarding"
          signInUrl="/auth/login"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-light px-4">
      <AuthForm mode="sign-up" />
    </div>
  );
}
