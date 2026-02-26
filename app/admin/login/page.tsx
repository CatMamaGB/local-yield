/**
 * Admin login — hidden entry point (not linked in nav). Clerk SignIn when configured; dev AuthForm otherwise.
 * After sign-in, redirects to /admin only if canAdmin; otherwise /admin/forbidden.
 */

import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserCapabilities } from "@/lib/authz/client";
import { AuthForm } from "@/components/AuthForm";

const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
);

export default async function AdminLoginPage() {
  const user = await getCurrentUser();
  if (user) {
    const { canAdmin } = getUserCapabilities(user);
    if (canAdmin) redirect("/admin");
    redirect("/admin/forbidden");
  }

  if (clerkConfigured) {
    return (
      <div className="mx-auto max-w-md py-10">
        <SignIn
          appearance={{
            variables: { colorPrimary: "#5D4524" },
          }}
          afterSignInUrl="/admin"
          signUpUrl="/auth/signup"
        />
        <p className="mt-4 text-center text-sm text-brand/80">
          Not linked from the main site. Sign in with an admin account to access admin.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <AuthForm mode="sign-in" requestedUrl="/admin" />
    </div>
  );
}
