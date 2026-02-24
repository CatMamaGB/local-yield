/**
 * POST /api/dashboard/conversations/[id]/messages — send a message in a conversation.
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { sendMessage } from "@/lib/messaging";
import { ok, fail, parseJsonBody } from "@/lib/api";
import { logError } from "@/lib/logger";
import { checkRateLimit, RATE_LIMIT_PRESETS } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-id";
import { SendMessageSchema } from "@/lib/validators";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  const rateLimitRes = await checkRateLimit(request, RATE_LIMIT_PRESETS.MESSAGES, requestId);
  if (rateLimitRes) return rateLimitRes;

  try {
    const user = await requireAuth();
    const { id: conversationId } = await params;
    if (!conversationId) {
      return fail("Conversation ID required", { code: "VALIDATION_ERROR", status: 400, requestId });
    }

    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) {
      return fail(parseError, { code: "INVALID_JSON", status: 400, requestId });
    }

    const validation = SendMessageSchema.safeParse(body);
    if (!validation.success) {
      const first = validation.error.issues[0];
      return fail(first?.message ?? "Invalid request", {
        code: "VALIDATION_ERROR",
        status: 400,
        requestId,
      });
    }

    const message = await sendMessage({
      conversationId,
      senderId: user.id,
      body: validation.data.body,
    });

    return ok(
      {
        id: message.id,
        body: message.body,
        createdAt: message.createdAt.toISOString(),
        fromMe: true,
      },
      requestId
    );
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("PII_DETECTED:")) {
      return fail("Message contains information we cannot allow. Please rephrase.", {
        code: "PII_DETECTED",
        status: 400,
        requestId,
      });
    }
    if (e instanceof Error && e.message === "Conversation not found") {
      return fail("Conversation not found", { code: "NOT_FOUND", status: 404, requestId });
    }
    logError("dashboard/conversations/[id]/messages/POST", e, {
      requestId,
      path: "/api/dashboard/conversations/[id]/messages",
      method: "POST",
    });
    return fail("Failed to send message", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
