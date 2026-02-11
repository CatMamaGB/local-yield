/**
 * API: set or clear producer's optional note for a buyer (Tier 2: Your customers).
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { setProducerCustomerNote } from "@/lib/customers";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "PRODUCER" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { buyerId?: string; note?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const buyerId = typeof body.buyerId === "string" ? body.buyerId.trim() : null;
  const note = body.note === undefined ? undefined : (body.note === null ? null : String(body.note).trim() || null);

  if (!buyerId) {
    return NextResponse.json({ error: "buyerId required" }, { status: 400 });
  }

  await setProducerCustomerNote(user.id, buyerId, note ?? null);
  return NextResponse.json({ ok: true });
}
