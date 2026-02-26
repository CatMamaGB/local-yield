"use client";

/**
 * Client wrapper for admin layout: allows /admin/login without auth; otherwise enforces auth + canAdmin.
 */

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { getUserCapabilities } from "@/lib/authz/client";
import type { SessionUser } from "@/lib/auth/types";
import { AdminNav } from "./AdminNav";

export function AdminLayoutClient({
  user,
  children,
}: {
  user: SessionUser | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return;
    if (!user) {
      router.replace("/auth/login?next=" + encodeURIComponent("/admin"));
      return;
    }
    const { canAdmin } = getUserCapabilities(user);
    if (!canAdmin) {
      router.replace("/admin/forbidden");
    }
  }, [isLoginPage, user, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }
  if (!user) {
    return null;
  }
  const { canAdmin } = getUserCapabilities(user);
  if (!canAdmin) {
    return null;
  }
  return (
    <div className="min-h-screen bg-brand-light">
      <AdminNav />
      <main>{children}</main>
    </div>
  );
}
