/**
 * GET /api/dashboard/conversations — list conversations for current user (producer/buyer).
 * Returns other participant and last message for each. Paginated via page, pageSize.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { ok, fail, addCorsHeaders, handleCorsPreflight } from "@/lib/api";
import { mapAuthErrorToResponse } from "@/lib/auth/error-handler";
import { logError } from "@/lib/logger";
import { getRequestId } from "@/lib/request-id";
import { ConversationsQuerySchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  try {
    const user = await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      page: searchParams.get("page") || undefined,
      pageSize: searchParams.get("pageSize") || undefined,
    };
    const validation = ConversationsQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      const first = validation.error.issues[0];
      return fail(first?.message ?? "Invalid query parameters", {
        code: "VALIDATION_ERROR",
        status: 400,
        requestId,
      });
    }
    const page = validation.data.page ?? 1;
    const pageSize = validation.data.pageSize ?? 50;
    const skip = (page - 1) * pageSize;

    const where = {
      OR: [{ userAId: user.id }, { userBId: user.id }],
    };

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take: pageSize,
        include: {
          userA: { select: { id: true, name: true, email: true } },
          userB: { select: { id: true, name: true, email: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { body: true, createdAt: true, senderId: true },
          },
        },
      }),
      prisma.conversation.count({ where }),
    ]);

    const list = conversations.map((c) => {
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

    const response = ok({ items: list, page, pageSize, total, conversations: list }, requestId);
    return addCorsHeaders(response, request);
  } catch (e) {
    logError("dashboard/conversations/GET", e, { requestId, path: "/api/dashboard/conversations", method: "GET" });
    const errorResponse = mapAuthErrorToResponse(e, requestId);
    return addCorsHeaders(errorResponse, request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflight(request) || new Response(null, { status: 403 });
}
