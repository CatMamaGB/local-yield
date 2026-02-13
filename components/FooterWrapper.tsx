"use client";

/**
 * Renders the Footer only when not on a "hide chrome" route.
 * Uses HIDE_CHROME_ROUTES so /auth, /invite, /reset-password, etc. stay minimal.
 */

import { usePathname } from "next/navigation";
import { Footer } from "@/components/Footer";
import { shouldHideChrome } from "@/lib/nav-routes";

export function FooterWrapper() {
  const pathname = usePathname();
  if (shouldHideChrome(pathname)) {
    return null;
  }
  return <Footer />;
}
