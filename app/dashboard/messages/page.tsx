/**
 * Messages — producer/buyer: list conversations with customers or producers.
 */

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardMessagesClient, type ConversationRow } from "./DashboardMessagesClient";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function DashboardMessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  // Fetch conversations server-side to avoid client-side loading state
  let initialConversations: ConversationRow[] = [];
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ userAId: user.id }, { userBId: user.id }],
      },
      orderBy: { updatedAt: "desc" },
      include: {
        userA: { select: { id: true, name: true, email: true } },
        userB: { select: { id: true, name: true, email: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { body: true, createdAt: true, senderId: true },
        },
      },
    });

    initialConversations = conversations.map((c) => {
      const other = c.userAId === user.id ? c.userB : c.userA;
      const lastMessage = c.messages[0];
      return {
        id: c.id,
        other: { id: other.id, name: other.name, email: other.email },
        orderId: c.orderId,
        lastMessage: lastMessage
          ? {
              body: lastMessage.body,
              createdAt: lastMessage.createdAt.toISOString(),
              fromMe: lastMessage.senderId === user.id,
            }
          : null,
        updatedAt: c.updatedAt.toISOString(),
      };
    });
  } catch (error) {
    // If fetch fails, client will handle it
    console.error("Failed to fetch conversations server-side:", error);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageHeader
        title="Messages"
        subtitle="Customer communications. Start a conversation from an order or here."
      />
      <DashboardMessagesClient initialConversations={initialConversations} />
    </div>
  );
}
