/**
 * My bids — list of help exchange bids placed by the current user.
 */

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { MyBidsClient } from "./MyBidsClient";

export default async function MyBidsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const bids = await prisma.helpExchangeBid.findMany({
    where: { bidderId: user.id },
    include: {
      posting: {
        select: {
          id: true,
          title: true,
          category: true,
          zipCode: true,
          status: true,
          createdBy: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = bids.map((b) => ({
    id: b.id,
    message: b.message,
    status: b.status,
    createdAt: b.createdAt.toISOString(),
    posting: b.posting,
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageHeader
        title="My bids"
        subtitle="Applications you've placed on farm help jobs."
      />
      <MyBidsClient initialBids={serialized} />
    </div>
  );
}
