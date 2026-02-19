/**
 * Post a Help Exchange job: form for creating help exchange postings.
 * Auth required (canPostCareJob capability).
 */

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { requireCapability } from "@/lib/authz";
import { PostJobForm } from "./PostJobForm";

export default async function PostJobPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  const authz = await requireCapability("canPostCareJob");
  if (!authz.ok) {
    redirect("/care");
  }

  return (
    <div className="min-h-screen bg-brand-light">
      <section className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-display text-2xl font-semibold text-brand">
          Post a help exchange job
        </h1>
        <p className="mt-2 text-sm text-brand/80">
          Post a job for farm help: fence repairs, garden work, equipment help.
        </p>
        <div className="mt-8">
          <PostJobForm />
        </div>
      </section>
    </div>
  );
}
