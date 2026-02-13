/**
 * Messages — producer/buyer: list conversations with customers or producers.
 */

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DashboardMessagesClient } from "./DashboardMessagesClient";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function DashboardMessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageHeader
        title="Messages"
        subtitle="Customer communications. Start a conversation from an order or here."
      />
      <DashboardMessagesClient />
    </div>
  );
}
