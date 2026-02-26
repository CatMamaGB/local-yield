/**
 * GET /api/dashboard/profile — current user + producer profile (business page fields) + upcoming events.
 * PATCH /api/dashboard/profile — update name, bio, producer profile (delivery + about, story, contact, etc.).
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProducerOrAdmin } from "@/lib/auth";
import { ok, fail, parseJsonBody, addCorsHeaders, handleCorsPreflight, withCorsOnRateLimit } from "@/lib/api";
import { mapAuthErrorToResponse } from "@/lib/auth/error-handler";
import { ProfileUpdateSchema } from "@/lib/validators";
import { logError } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-id";

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  try {
    const user = await requireProducerOrAdmin();
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        bio: true,
        zipCode: true,
        producerProfile: true,
      },
    });
    if (!dbUser) return addCorsHeaders(fail("Not found", { code: "NOT_FOUND", status: 404, requestId }), request);
    const profile = dbUser.producerProfile;
    const upcomingEvents = await prisma.event.findMany({
      where: { userId: user.id, eventDate: { gte: new Date() } },
      orderBy: { eventDate: "asc" },
      take: 20,
    });
    const response = ok({
      user: {
        name: dbUser.name,
        bio: dbUser.bio,
        zipCode: dbUser.zipCode,
      },
      producerProfile: profile
        ? {
            offersDelivery: profile.offersDelivery,
            deliveryFeeCents: profile.deliveryFeeCents,
            pickupNotes: profile.pickupNotes,
            pickupZipCode: profile.pickupZipCode,
            aboutUs: profile.aboutUs,
            story: profile.story,
            profileImageUrl: profile.profileImageUrl,
            contactEmail: profile.contactEmail,
            generalLocation: profile.generalLocation,
            availabilityHours: profile.availabilityHours,
            acceptInAppMessagesOnly: profile.acceptInAppMessagesOnly,
          }
        : null,
      upcomingEvents: upcomingEvents.map((e) => ({
        id: e.id,
        name: e.name,
        location: e.location,
        eventDate: e.eventDate.toISOString(),
        eventHours: e.eventHours,
      })),
    }, requestId);
    return addCorsHeaders(response, request);
  } catch (e) {
    logError("dashboard/profile/GET", e, { requestId, path: "/api/dashboard/profile", method: "GET" });
    const errorResponse = mapAuthErrorToResponse(e, requestId);
    return addCorsHeaders(errorResponse, request);
  }
}

export async function PATCH(request: NextRequest) {
  const requestId = getRequestId(request);
  const rateLimitRes = await checkRateLimit(request, undefined, requestId);
  if (rateLimitRes) return withCorsOnRateLimit(rateLimitRes, request) ?? rateLimitRes;

  try {
    const user = await requireProducerOrAdmin();
    
    // Parse and validate request body
    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) {
      return addCorsHeaders(fail(parseError, { code: "INVALID_JSON", status: 400, requestId }), request);
    }

    // Validate ZIP code if provided
    if (body.zipCode !== undefined) {
      const zipValidation = ProfileUpdateSchema.shape.zipCode.safeParse(body.zipCode);
      if (!zipValidation.success) {
        return addCorsHeaders(fail("Invalid ZIP code. Must be a valid 5-digit ZIP code.", { code: "INVALID_ZIP", status: 400, requestId }), request);
      }
    }

    // Validate pickupZipCode if provided
    if (body.pickupZipCode !== null && body.pickupZipCode !== undefined) {
      const pickupZipValidation = ProfileUpdateSchema.shape.pickupZipCode.safeParse(body.pickupZipCode);
      if (!pickupZipValidation.success) {
        return addCorsHeaders(fail("Invalid pickup ZIP code. Must be a valid 5-digit ZIP code.", { code: "INVALID_PICKUP_ZIP", status: 400, requestId }), request);
      }
    }

    const name = body.name !== undefined ? String(body.name).trim() || null : undefined;
    const bio = body.bio !== undefined ? String(body.bio).trim() || null : undefined;
    const zipCode = body.zipCode !== undefined ? String(body.zipCode).trim().slice(0, 5) : undefined;
    const offersDelivery = body.offersDelivery !== undefined ? Boolean(body.offersDelivery) : undefined;
    const deliveryFeeCents = body.deliveryFeeCents !== undefined ? Number(body.deliveryFeeCents) : undefined;
    const pickupNotes = body.pickupNotes !== undefined ? String(body.pickupNotes).trim() || null : undefined;
    // Handle pickupZipCode: null means clear the field, undefined means don't update
    const pickupZipCode =
      body.pickupZipCode === null
        ? null
        : body.pickupZipCode !== undefined
          ? String(body.pickupZipCode).trim().slice(0, 5) || null
          : undefined;

    const aboutUs = body.aboutUs !== undefined ? String(body.aboutUs).trim() || null : undefined;
    const story = body.story !== undefined ? String(body.story).trim() || null : undefined;
    const profileImageUrl = body.profileImageUrl !== undefined ? String(body.profileImageUrl).trim() || null : undefined;
    const contactEmail = body.contactEmail !== undefined ? String(body.contactEmail).trim() || null : undefined;
    const generalLocation = body.generalLocation !== undefined ? String(body.generalLocation).trim() || null : undefined;
    const availabilityHours = body.availabilityHours !== undefined ? String(body.availabilityHours).trim() || null : undefined;
    const acceptInAppMessagesOnly = body.acceptInAppMessagesOnly !== undefined ? Boolean(body.acceptInAppMessagesOnly) : undefined;

    if (contactEmail !== undefined && contactEmail && !ProfileUpdateSchema.shape.contactEmail.safeParse(contactEmail).success) {
      return addCorsHeaders(fail("Invalid contact email.", { code: "INVALID_EMAIL", status: 400, requestId }), request);
    }
    if (profileImageUrl !== undefined && profileImageUrl && !ProfileUpdateSchema.shape.profileImageUrl.safeParse(profileImageUrl).success) {
      return addCorsHeaders(fail("Invalid profile image URL.", { code: "INVALID_URL", status: 400, requestId }), request);
    }

    if (name !== undefined || bio !== undefined || zipCode !== undefined) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(name !== undefined && { name }),
          ...(bio !== undefined && { bio }),
          ...(zipCode !== undefined && { zipCode }),
        },
      });
    }

    const updateData: {
      offersDelivery?: boolean;
      deliveryFeeCents?: number;
      pickupNotes?: string | null;
      pickupZipCode?: string | null;
      aboutUs?: string | null;
      story?: string | null;
      profileImageUrl?: string | null;
      contactEmail?: string | null;
      generalLocation?: string | null;
      availabilityHours?: string | null;
      acceptInAppMessagesOnly?: boolean;
    } = {};
    if (offersDelivery !== undefined) updateData.offersDelivery = offersDelivery;
    if (deliveryFeeCents !== undefined && Number.isInteger(deliveryFeeCents) && deliveryFeeCents >= 0)
      updateData.deliveryFeeCents = deliveryFeeCents;
    if (pickupNotes !== undefined) updateData.pickupNotes = pickupNotes;
    if (pickupZipCode !== undefined) updateData.pickupZipCode = pickupZipCode;
    if (aboutUs !== undefined) updateData.aboutUs = aboutUs;
    if (story !== undefined) updateData.story = story;
    if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl;
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
    if (generalLocation !== undefined) updateData.generalLocation = generalLocation;
    if (availabilityHours !== undefined) updateData.availabilityHours = availabilityHours;
    if (acceptInAppMessagesOnly !== undefined) updateData.acceptInAppMessagesOnly = acceptInAppMessagesOnly;

    if (Object.keys(updateData).length > 0) {
      await prisma.producerProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          ...updateData,
        },
        update: updateData,
      });
    }

    const response = ok(undefined, requestId);
    return addCorsHeaders(response, request);
  } catch (e) {
    logError("dashboard/profile/PATCH", e, { requestId, path: "/api/dashboard/profile", method: "PATCH" });
    const errorResponse = mapAuthErrorToResponse(e, requestId);
    return addCorsHeaders(errorResponse, request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflight(request) || new Response(null, { status: 403 });
}
