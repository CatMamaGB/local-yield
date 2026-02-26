/**
 * POST /api/upload/image — upload a single image for product photo.
 * Expects multipart/form-data with field "file". Returns { url } on success.
 * Validates MIME, size, file signature (magic bytes), and dimensions.
 * Uses Vercel Blob when BLOB_READ_WRITE_TOKEN is set; otherwise returns 503 with message to use URL.
 */

import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api";
import { mapAuthErrorToResponse } from "@/lib/auth/error-handler";
import { getRequestId } from "@/lib/request-id";
import { requireProducerOrAdmin } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  validateImageMagicBytes,
  getImageDimensions,
  validateImageDimensions,
} from "@/lib/upload-image-validation";

const MAX_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB (under Vercel serverless limit)
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  const rateLimitRes = await checkRateLimit(request, undefined, requestId);
  if (rateLimitRes) return rateLimitRes;

  try {
    await requireProducerOrAdmin();
  } catch (e) {
    return mapAuthErrorToResponse(e, requestId);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return fail("Missing file in form field 'file'", { code: "VALIDATION_ERROR", status: 400, requestId });
    }
    if (file.size > MAX_SIZE_BYTES) {
      return fail("Image must be under 4 MB", { code: "VALIDATION_ERROR", status: 400, requestId });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return fail("Image must be JPEG, PNG, WebP, or GIF", { code: "VALIDATION_ERROR", status: 400, requestId });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detectedType = validateImageMagicBytes(buffer);
    if (!detectedType || !ALLOWED_TYPES.includes(detectedType)) {
      return fail("File signature does not match a valid image (JPEG, PNG, WebP, or GIF)", {
        code: "VALIDATION_ERROR",
        status: 400,
        requestId,
      });
    }

    const dims = await getImageDimensions(buffer);
    if (dims) {
      const dimError = validateImageDimensions(dims);
      if (dimError) {
        return fail(dimError, { code: "VALIDATION_ERROR", status: 400, requestId });
      }
    }

    const { put } = await import("@vercel/blob");
    const ext = file.name.split(".").pop() || "jpg";
    const prefix = `products/${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const blob = await put(`${prefix}.${ext}`, file, { access: "public" });
    return ok({ url: blob.url });
  } catch (err) {
    const isConfig = err instanceof Error && (
      err.message.includes("BLOB_READ_WRITE_TOKEN") ||
      err.message.includes("Cannot find module") ||
      err.message.includes("blob")
    );
    if (isConfig) {
      return fail("Image upload not configured. Add image URL below or set BLOB_READ_WRITE_TOKEN.", {
        code: "SERVICE_UNAVAILABLE",
        status: 503,
        requestId,
      });
    }
    return fail("Upload failed", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
