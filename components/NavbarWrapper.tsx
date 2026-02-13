"use client";

/**
 * Renders the main Navbar only when not on a "hide chrome" route.
 * Uses HIDE_CHROME_ROUTES so /auth, /invite, /reset-password, etc. stay minimal.
 */

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { shouldHideChrome } from "@/lib/nav-routes";
import type { SessionUser } from "@/lib/auth";

interface NavbarWrapperProps {
  user: SessionUser | null;
}

export function NavbarWrapper({ user }: NavbarWrapperProps) {
  const pathname = usePathname();
  if (shouldHideChrome(pathname)) {
    return null;
  }
  return <Navbar user={user} />;
}
