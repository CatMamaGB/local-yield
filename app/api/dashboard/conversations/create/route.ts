/**
 * POST /api/dashboard/conversations/create - Create a conversation with another user
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getOrCreateConversation } from "@/lib/messaging";
import { ok, fail, parseJsonBody, withRequestId, addCorsHeaders, handleCorsPreflight, withCorsOnRateLimit } from "@/lib/api";
import { mapAuthErrorToResponse } from "@/lib/auth/error-handler";
import { logError } from "@/lib/logger";
import { checkRateLimit, RATE_LIMIT_PRESETS } from "@/lib/rate-limit";
import { z } from "zod";

const CreateConversationSchema = z.object({
  userId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const requestId = withRequestId(request);
  const rateLimitRes = await checkRateLimit(request, RATE_LIMIT_PRESETS.MESSAGES, requestId);
  if (rateLimitRes) return withCorsOnRateLimit(rateLimitRes, request) ?? rateLimitRes;

  try {
    const user = await requireAuth();
    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) return fail(parseError, { code: "INVALID_JSON", status: 400, requestId });

    const validation = CreateConversationSchema.safeParse(body);
    if (!validation.success) {
      const first = validation.error.issues[0];
      return fail(first?.message ?? "Invalid request", { code: "VALIDATION_ERROR", status: 400, requestId });
    }

    if (validation.data.userId === user.id) {
      return fail("Cannot create conversation with yourself", { code: "VALIDATION_ERROR", status: 400, requestId });
    }

    const conversation = await getOrCreateConversation({
      userAId: user.id,
      userBId: validation.data.userId,
    });

    const response = ok({ conversationId: conversation.id }, requestId);
    return addCorsHeaders(response, request);
  } catch (error) {
    logError("dashboard/conversations/create/POST", error, {
      requestId,
      path: "/api/dashboard/conversations/create",
      method: "POST",
    });
    const errorResponse = mapAuthErrorToResponse(error, requestId);
    return addCorsHeaders(errorResponse, request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflight(request) || new Response(null, { status: 403 });
}
