/**
 * My cases: reports I filed (mine) + cases involving my orders (forMe, producer).
 */

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { CasesClient } from "./CasesClient";

export default async function DashboardCasesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const isProducer = user.isProducer === true || user.role === "PRODUCER" || user.role === "ADMIN";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-brand">My cases</h1>
      <p className="mt-2 text-brand/80">
        Reports you filed and {isProducer ? "cases involving your orders" : "dispute status"}.
      </p>
      <div className="mt-6">
        <CasesClient isProducer={isProducer} />
      </div>
    </div>
  );
}
