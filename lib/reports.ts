/**
 * Reporting system: create and manage reports for moderation.
 * Order reports (entityType=order) are "disputes" and require problemType + proposedOutcome.
 */

import { prisma } from "./prisma";
import type { ReportReason, ReportStatus } from "@prisma/client";
import type { OrderDisputeProblemType, OrderDisputeProposedOutcome } from "@prisma/client";

export interface ReportAttachmentInput {
  url: string;
  mimeType: string;
  sizeBytes: number;
}

export interface CreateReportInput {
  reporterId: string;
  reason: ReportReason;
  description?: string;
  entityType: "caregiver" | "help_exchange_posting" | "order";
  entityId: string;
  /** Required when entityType === "order" */
  problemType?: OrderDisputeProblemType;
  proposedOutcome?: OrderDisputeProposedOutcome;
  /** Max 3 attachments (images only); used for order disputes */
  attachments?: ReportAttachmentInput[];
}

const MAX_ATTACHMENTS = 3;

export async function createReport(input: CreateReportInput) {
  const attachments = (input.attachments || []).slice(0, MAX_ATTACHMENTS);
  return prisma.report.create({
    data: {
      reporterId: input.reporterId,
      reason: input.reason,
      description: input.description?.trim() || null,
      entityType: input.entityType,
      entityId: input.entityId,
      status: "PENDING",
      problemType: input.problemType ?? undefined,
      proposedOutcome: input.proposedOutcome ?? undefined,
      attachments: attachments.length
        ? {
            create: attachments.map((a) => ({
              url: a.url,
              mimeType: a.mimeType,
              sizeBytes: a.sizeBytes,
            })),
          }
        : undefined,
    },
    include: { attachments: true },
  });
}

const reportsInclude = {
  reporter: {
    select: { id: true, name: true, email: true },
  },
  reviewer: {
    select: { id: true, name: true },
  },
  assignedTo: {
    select: { id: true, name: true },
  },
  attachments: true,
} as const;

export async function getReportsForAdmin(filters?: {
  status?: ReportStatus;
  entityType?: string;
}) {
  return prisma.report.findMany({
    where: {
      ...(filters?.status && { status: filters.status }),
      ...(filters?.entityType && { entityType: filters.entityType }),
    },
    include: reportsInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getReportsForAdminPaginated(
  filters: { status?: ReportStatus; entityType?: string } | undefined,
  page: number,
  pageSize: number
) {
  const where = {
    ...(filters?.status && { status: filters.status }),
    ...(filters?.entityType && { entityType: filters.entityType }),
  };
  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      include: reportsInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.report.count({ where }),
  ]);
  return { reports, total };
}

export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
  reviewedById: string
) {
  return prisma.report.update({
    where: { id: reportId },
    data: {
      status,
      reviewedAt: new Date(),
      reviewedById,
    },
  });
}

/** Get reports where current user is the reporter (My cases) */
export async function getReportsMine(userId: string, page: number, pageSize: number) {
  const where = { reporterId: userId };
  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      include: reportsInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.report.count({ where }),
  ]);
  return { reports, total };
}

/** Get reports where entityType=order and order.producerId = userId (Cases involving my orders) */
export async function getReportsForProducer(userId: string, page: number, pageSize: number) {
  const orderIds = await prisma.order.findMany({
    where: { producerId: userId },
    select: { id: true },
  });
  const ids = orderIds.map((o) => o.id);
  const where = { entityType: "order", entityId: { in: ids } };
  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      include: reportsInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.report.count({ where }),
  ]);
  return { reports, total };
}

/** Get single report by id; for admin or reporter or (when order) producer */
export async function getReportById(id: string) {
  return prisma.report.findUnique({
    where: { id },
    include: reportsInclude,
  });
}

export interface UpdateReportAdminInput {
  assignedToId?: string | null;
  status?: ReportStatus;
  resolutionOutcome?: string | null;
  resolutionNote?: string | null;
  resolutionAmountCents?: number | null;
  reviewedById: string;
}

export async function updateReportAdmin(reportId: string, input: UpdateReportAdminInput) {
  const data: Parameters<typeof prisma.report.update>[0]["data"] = {
    reviewedAt: new Date(),
    reviewedById: input.reviewedById,
  };
  if (input.assignedToId !== undefined) data.assignedToId = input.assignedToId;
  if (input.status !== undefined) data.status = input.status;
  if (input.resolutionOutcome !== undefined)
    data.resolutionOutcome = input.resolutionOutcome as any;
  if (input.resolutionNote !== undefined) data.resolutionNote = input.resolutionNote;
  if (input.resolutionAmountCents !== undefined)
    data.resolutionAmountCents = input.resolutionAmountCents;
  return prisma.report.update({
    where: { id: reportId },
    data,
    include: reportsInclude,
  });
}
