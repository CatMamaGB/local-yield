/**
 * GET /api/dashboard/profile — current user + producer profile (producer or admin).
 * PATCH /api/dashboard/profile — update name, bio, zipCode, producer profile (offersDelivery, deliveryFeeCents, pickupNotes, pickupZipCode).
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProducerOrAdmin } from "@/lib/auth";

export async function GET() {
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
    if (!dbUser) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({
      user: {
        name: dbUser.name,
        bio: dbUser.bio,
        zipCode: dbUser.zipCode,
      },
      producerProfile: dbUser.producerProfile
        ? {
            offersDelivery: dbUser.producerProfile.offersDelivery,
            deliveryFeeCents: dbUser.producerProfile.deliveryFeeCents,
            pickupNotes: dbUser.producerProfile.pickupNotes,
            pickupZipCode: dbUser.producerProfile.pickupZipCode,
          }
        : null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Forbidden";
    return Response.json({ error: message }, { status: 403 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireProducerOrAdmin();
    const body = await request.json();

    const name = body.name !== undefined ? String(body.name).trim() || null : undefined;
    const bio = body.bio !== undefined ? String(body.bio).trim() || null : undefined;
    const zipCode = body.zipCode !== undefined ? String(body.zipCode).trim().slice(0, 5) : undefined;
    const offersDelivery = body.offersDelivery !== undefined ? Boolean(body.offersDelivery) : undefined;
    const deliveryFeeCents = body.deliveryFeeCents !== undefined ? Number(body.deliveryFeeCents) : undefined;
    const pickupNotes = body.pickupNotes !== undefined ? String(body.pickupNotes).trim() || null : undefined;
    const pickupZipCode = body.pickupZipCode !== undefined ? String(body.pickupZipCode).trim().slice(0, 5) || null : undefined;

    if (name !== undefined || bio !== undefined || zipCode !== undefined) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(name !== undefined && { name }),
          ...(bio !== undefined && { bio }),
          ...(zipCode !== undefined && /^\d{5}$/.test(zipCode) && { zipCode }),
        },
      });
    }

    const updateData: {
      offersDelivery?: boolean;
      deliveryFeeCents?: number;
      pickupNotes?: string | null;
      pickupZipCode?: string | null;
    } = {};
    if (offersDelivery !== undefined) updateData.offersDelivery = offersDelivery;
    if (deliveryFeeCents !== undefined && Number.isInteger(deliveryFeeCents) && deliveryFeeCents >= 0)
      updateData.deliveryFeeCents = deliveryFeeCents;
    if (pickupNotes !== undefined) updateData.pickupNotes = pickupNotes;
    if (pickupZipCode !== undefined) updateData.pickupZipCode = pickupZipCode;

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

    return Response.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Forbidden";
    return Response.json({ error: message }, { status: 403 });
  }
}
