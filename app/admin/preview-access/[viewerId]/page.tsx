/**
 * Admin: Preview access — last 50 logs for a viewer.
 */

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const LOGS_PER_PAGE = 50;

export default async function AdminPreviewAccessViewerPage({
  params,
}: {
  params: Promise<{ viewerId: string }>;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }

  const { viewerId } = await params;
  const viewer = await prisma.previewViewer.findUnique({
    where: { id: viewerId },
    include: {
      logs: {
        orderBy: { createdAt: "desc" },
        take: LOGS_PER_PAGE,
        select: { id: true, path: true, createdAt: true },
      },
    },
  });

  if (!viewer) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link
        href="/admin/preview-access"
        className="text-sm font-medium text-brand-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 rounded"
      >
        ← Back to preview access
      </Link>
      <h1 className="font-display text-2xl font-semibold text-brand mt-4">
        Access logs: {viewer.name}
      </h1>
      <p className="mt-1 text-brand/80 text-sm">
        {viewer.email} — last {LOGS_PER_PAGE} page views
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-brand/10 bg-white shadow-farmhouse">
        <table className="min-w-full divide-y divide-brand/10" role="table">
          <thead>
            <tr className="bg-brand/5">
              <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-brand">
                Time
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-brand">
                Path
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand/10">
            {viewer.logs.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-brand/70">
                  No logs for this viewer.
                </td>
              </tr>
            ) : (
              viewer.logs.map((log) => (
                <tr key={log.id} className="hover:bg-brand/5">
                  <td className="px-4 py-3 text-sm text-brand/90">
                    {log.createdAt.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-brand font-mono">
                    {log.path}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
