"use client";

/**
 * Sign out: when Clerk is configured uses Clerk signOut; otherwise POST /api/auth/sign-out and redirect.
 */

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/client/api-client";

// Check if Clerk is configured (available in client via NEXT_PUBLIC_ env var, replaced at build time)
const isClerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/**
 * Wrapper component that only uses Clerk hooks when ClerkProvider is mounted.
 * When Clerk is not configured, renders a stub sign-out button.
 */
function ClerkSignOutButton() {
  const router = useRouter();
  const clerk = useClerk();

  async function handleClick() {
    if (clerk?.signOut) {
      await clerk.signOut({ redirectUrl: "/" });
      return;
    }
    try {
      await apiPost("/api/auth/sign-out");
      router.push("/");
      router.refresh();
    } catch {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-brand/80 hover:text-brand-accent"
    >
      Sign out
    </button>
  );
}

/**
 * Stub sign-out button for when Clerk is not configured (dev/stub auth).
 */
function StubSignOutButton() {
  const router = useRouter();

  async function handleClick() {
    try {
      await apiPost("/api/auth/sign-out");
      router.push("/");
      router.refresh();
    } catch {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-brand/80 hover:text-brand-accent"
    >
      Sign out
    </button>
  );
}

export function SignOutButton() {
  // Only use Clerk hooks if Clerk is configured and ClerkProvider is mounted
  // We check env var to determine which component to render
  if (isClerkConfigured) {
    return <ClerkSignOutButton />;
  }
  return <StubSignOutButton />;
}
