/**
 * Admin: Preview access — list viewers and their access stats.
 * requireAdmin(); viewers table with link to last 50 logs per viewer.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminPreviewAccessPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }

  const viewers = await prisma.previewViewer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { logs: true } },
      logs: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-brand">
        Preview access
      </h1>
      <p className="mt-2 text-brand/80">
        Viewers who entered the private preview (name, email, first/last seen, total page views).
        Click a viewer to see their last 50 access logs.
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-brand/10 bg-white shadow-farmhouse">
        <table className="min-w-full divide-y divide-brand/10" role="table">
          <thead>
            <tr className="bg-brand/5">
              <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-brand">
                Name
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-brand">
                Email
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-brand">
                First seen
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-brand">
                Last seen
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-brand">
                Total views
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-brand">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand/10">
            {viewers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-brand/70">
                  No preview viewers yet.
                </td>
              </tr>
            ) : (
              viewers.map((v) => {
                const firstSeen = v.createdAt;
                const lastLog = v.logs[0];
                const lastSeen = lastLog?.createdAt ?? v.createdAt;
                return (
                  <tr key={v.id} className="hover:bg-brand/5">
                    <td className="px-4 py-3 text-sm text-brand">{v.name}</td>
                    <td className="px-4 py-3 text-sm text-brand">{v.email}</td>
                    <td className="px-4 py-3 text-sm text-brand/90">
                      {firstSeen.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-brand/90">
                      {lastSeen.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-brand/90">
                      {v._count.logs}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/preview-access/${v.id}`}
                        className="text-sm font-medium text-brand-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 rounded"
                      >
                        View logs
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
