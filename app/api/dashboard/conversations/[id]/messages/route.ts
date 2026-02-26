/**
 * POST /api/dashboard/conversations/[id]/messages — send a message in a conversation.
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { sendMessage } from "@/lib/messaging";
import { ok, fail, parseJsonBody, addCorsHeaders, handleCorsPreflight, withCorsOnRateLimit } from "@/lib/api";
import { mapAuthErrorToResponse } from "@/lib/auth/error-handler";
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
  if (rateLimitRes) return withCorsOnRateLimit(rateLimitRes, request) ?? rateLimitRes;

  try {
    const user = await requireAuth();
    const { id: conversationId } = await params;
    if (!conversationId) {
      return addCorsHeaders(fail("Conversation ID required", { code: "VALIDATION_ERROR", status: 400, requestId }), request);
    }

    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) {
      return addCorsHeaders(fail(parseError, { code: "INVALID_JSON", status: 400, requestId }), request);
    }

    const validation = SendMessageSchema.safeParse(body);
    if (!validation.success) {
      const first = validation.error.issues[0];
      return addCorsHeaders(fail(first?.message ?? "Invalid request", {
        code: "VALIDATION_ERROR",
        status: 400,
        requestId,
      }), request);
    }

    const message = await sendMessage({
      conversationId,
      senderId: user.id,
      body: validation.data.body,
    });

    return addCorsHeaders(ok(
      {
        id: message.id,
        body: message.body,
        createdAt: message.createdAt.toISOString(),
        fromMe: true,
      },
      requestId
    ), request);
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("PII_DETECTED:")) {
      return addCorsHeaders(fail("Message contains information we cannot allow. Please rephrase.", {
        code: "PII_DETECTED",
        status: 400,
        requestId,
      }), request);
    }
    if (e instanceof Error && e.message === "Conversation not found") {
      return addCorsHeaders(fail("Conversation not found", { code: "NOT_FOUND", status: 404, requestId }), request);
    }
    logError("dashboard/conversations/[id]/messages/POST", e, {
      requestId,
      path: "/api/dashboard/conversations/[id]/messages",
      method: "POST",
    });
    const errorResponse = mapAuthErrorToResponse(e, requestId);
    return addCorsHeaders(errorResponse, request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflight(request) || new Response(null, { status: 403 });
}
