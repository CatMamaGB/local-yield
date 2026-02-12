/**
 * POST /api/catalog/custom-categories — create a custom category (status PENDING).
 * Producer only. Immediately available to the creator; visible to others after admin approval.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProducerOrAdmin } from "@/lib/auth";
import { PREDEFINED_GROUP_IDS } from "@/lib/catalog-categories";

export async function POST(request: NextRequest) {
  try {
    const user = await requireProducerOrAdmin();
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const groupId = body.groupId != null ? String(body.groupId).trim() || null : null;
    if (groupId != null && !PREDEFINED_GROUP_IDS.includes(groupId)) {
      return NextResponse.json({ error: "Invalid group" }, { status: 400 });
    }
    const defaultImageUrl = body.defaultImageUrl != null ? String(body.defaultImageUrl).trim() || null : null;

    const customCategory = await prisma.customCategory.create({
      data: {
        name,
        groupId,
        defaultImageUrl,
        createdById: user.id,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      customCategory: {
        id: customCategory.id,
        name: customCategory.name,
        correctedName: customCategory.correctedName,
        status: customCategory.status,
        groupId: customCategory.groupId,
        defaultImageUrl: customCategory.defaultImageUrl,
        isMine: true,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create custom category";
    return NextResponse.json(
      { error: message },
      { status: e instanceof Error && e.message === "Forbidden" ? 403 : 400 }
    );
  }
}
