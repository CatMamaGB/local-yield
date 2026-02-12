/**
 * PATCH /api/dashboard/events/[id] — update event.
 * DELETE /api/dashboard/events/[id] — delete event.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProducerOrAdmin } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireProducerOrAdmin();
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const existing = await prisma.event.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    const body = await request.json().catch(() => ({}));
    const name = body.name !== undefined ? String(body.name).trim() : undefined;
    const location = body.location !== undefined ? String(body.location).trim() : undefined;
    const eventDate = body.eventDate ? new Date(body.eventDate) : undefined;
    const eventHours = body.eventHours !== undefined ? (String(body.eventHours).trim() || null) : undefined;
    const event = await prisma.event.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(location !== undefined && { location }),
        ...(eventDate !== undefined && !Number.isNaN(eventDate.getTime()) && { eventDate }),
        ...(eventHours !== undefined && { eventHours }),
      },
    });
    return NextResponse.json({
      event: {
        id: event.id,
        name: event.name,
        location: event.location,
        eventDate: event.eventDate.toISOString(),
        eventHours: event.eventHours,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Forbidden";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireProducerOrAdmin();
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const existing = await prisma.event.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Forbidden";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
