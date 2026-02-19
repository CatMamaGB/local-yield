/**
 * My job postings — list of help exchange postings created by the current user.
 */

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listHelpExchangePostingsByCreator } from "@/lib/help-exchange";
import { PageHeader } from "@/components/ui/PageHeader";
import { JobPostingsClient } from "./JobPostingsClient";

export default async function JobPostingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const postings = await listHelpExchangePostingsByCreator(user.id);

  const serialized = postings.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    category: p.category,
    zipCode: p.zipCode,
    radiusMiles: p.radiusMiles,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageHeader
        title="My job postings"
        subtitle="Farm help jobs you've posted. Mark as filled or close when done."
      />
      <JobPostingsClient initialPostings={serialized} />
    </div>
  );
}
