/**
 * Login: Clerk SignIn when configured; otherwise dev AuthForm (role picker → cookie).
 */

import { SignIn } from "@clerk/nextjs";
import { AuthForm } from "@/components/AuthForm";

const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
);

export default function LoginPage() {
  if (clerkConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-light px-4">
        <SignIn
          appearance={{
            variables: { colorPrimary: "#5D4524" },
          }}
          afterSignInUrl="/dashboard"
          signUpUrl="/auth/signup"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-light px-4">
      <AuthForm mode="sign-in" />
    </div>
  );
}
