/**
 * Producer store credit: balance and ledger. Credit applies to order total (orderTotalCents).
 */

import { prisma } from "./prisma";
import type { CreditLedgerReason } from "@prisma/client";

/** Computed balance for a buyer with a producer (positive = available). Excludes expired. */
export async function getCreditBalance(userId: string, producerId: string): Promise<number> {
  const result = await prisma.creditLedger.aggregate({
    where: {
      userId,
      producerId,
      // optional: add expiresAt: { gt: new Date() } when we use expiry
    },
    _sum: { amountCents: true },
  });
  return result._sum.amountCents ?? 0;
}

/** Ledger entries for a buyer with a producer (for "credit history"). */
export async function getCreditLedger(userId: string, producerId: string, limit = 50) {
  return prisma.creditLedger.findMany({
    where: { userId, producerId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  });
}

export interface IssueCreditInput {
  userId: string; // buyer who receives credit
  producerId: string;
  amountCents: number;
  reason: CreditLedgerReason;
  orderId?: string | null;
  reportId?: string | null;
  createdById: string;
}

/** Issue credit (positive ledger entry). Validates reason + reference (orderId or reportId). */
export async function issueCredit(input: IssueCreditInput) {
  if (input.amountCents <= 0) throw new Error("amountCents must be positive");
  if (!input.orderId && !input.reportId) throw new Error("orderId or reportId required for credit issuance");
  return prisma.creditLedger.create({
    data: {
      userId: input.userId,
      producerId: input.producerId,
      amountCents: input.amountCents,
      reason: input.reason,
      orderId: input.orderId ?? null,
      reportId: input.reportId ?? null,
      createdById: input.createdById,
    },
  });
}
