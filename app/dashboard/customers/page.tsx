/**
 * Your customers — Tier 2: optional growth tools (opt-in).
 * Customer list, repeat tracking, basic notes, export. "Your customers belong to you."
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { requireProducerOrAdmin } from "@/lib/auth";
import { getCustomersForProducer, customersToCsv } from "@/lib/customers";
import { formatDate } from "@/lib/utils";
import { CustomersClient, CustomerNoteField } from "./CustomersClient";

export default async function DashboardCustomersPage() {
  let user;
  try {
    user = await requireProducerOrAdmin();
  } catch {
    redirect("/dashboard");
  }

  const customers = await getCustomersForProducer(user.id);
  const csvContent = customersToCsv(customers);

  return (
    <div className="min-h-screen bg-brand-light">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-brand">Your customers</h1>
            <p className="mt-1 text-brand/80">
              Your customers belong to you. Keep a simple list and export anytime — we don&apos;t lock you in.
            </p>
          </div>
          <CustomersClient csvContent={csvContent} hasCustomers={customers.length > 0} />
        </div>

        <section className="mt-8 rounded-xl border border-brand/20 bg-white p-6">
          {customers.length === 0 ? (
            <p className="text-brand/70">
              No customers yet. When buyers order from you, they&apos;ll show here. You can add notes (e.g. &quot;CSA pickup,&quot; &quot;egg customer&quot;) and export your list anytime.
            </p>
          ) : (
            <>
              <ul className="space-y-4">
                {customers.map((c) => (
                  <li
                    key={c.buyerId}
                    className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-brand/10 bg-brand-light/30 p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-brand">{c.name || "Customer"}</p>
                      <p className="text-sm text-brand/70">{c.email}</p>
                      <p className="mt-1 text-xs text-brand/60">
                        {c.orderCount} order{c.orderCount !== 1 ? "s" : ""}
                        {c.lastOrderAt ? ` · Last order ${formatDate(c.lastOrderAt)}` : ""}
                      </p>
                    </div>
                    <CustomerNoteField buyerId={c.buyerId} initialNote={c.note} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <p className="mt-6 text-center">
          <Link href="/dashboard" className="text-sm text-brand-accent hover:underline">
            ← Back to dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
