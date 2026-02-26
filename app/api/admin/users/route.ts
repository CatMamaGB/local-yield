/**
 * GET /api/admin/users - List users with search and filters (admin only)
 * Query params: q (search email), role, capability, limit
 */

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserCapabilities, type UserCapabilities } from "@/lib/authz/client";
import { ok, fail, withRequestId } from "@/lib/api";
import { mapAuthErrorToResponse } from "@/lib/auth/error-handler";
import { logError } from "@/lib/logger";
import { AdminUsersQuerySchema } from "@/lib/validators";
import type { Role as PrismaRole } from "@prisma/client";
import type { Role } from "@local-yield/shared/types";
import type { SessionUser } from "@/lib/auth/types";
import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const requestId = withRequestId(request);
  try {
    await requireAdmin();
  } catch (e) {
    return mapAuthErrorToResponse(e, requestId);
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      q: searchParams.get("q") || undefined,
      role: searchParams.get("role") || undefined,
      capability: searchParams.get("capability") || undefined,
      page: searchParams.get("page") || undefined,
      pageSize: searchParams.get("pageSize") || undefined,
    };

    const validation = AdminUsersQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      const first = validation.error.issues[0];
      return fail(first?.message ?? "Invalid query parameters", {
        code: "VALIDATION_ERROR",
        status: 400,
        requestId,
      });
    }

    const q = validation.data.q?.toLowerCase();
    const role = validation.data.role;
    const capability = validation.data.capability;
    const page = validation.data.page ?? 1;
    const pageSize = validation.data.pageSize ?? 50;

    const where: Prisma.UserWhereInput = {};
    if (q) {
      where.email = { contains: q, mode: "insensitive" };
    }
    if (role) {
      where.role = role as PrismaRole;
    }

    // Cap initial fetch (capability filter is in-memory)
    const maxFetch = 2000;
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        zipCode: true,
        primaryMode: true,
        isProducer: true,
        isBuyer: true,
        isCaregiver: true,
        isHomesteadOwner: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: maxFetch,
    });

    // Convert Prisma users to SessionUser format (convert CAREGIVER/CARE_SEEKER roles to BUYER)
    const sessionUsers: SessionUser[] = users.map((user) => {
      const prismaRole = user.role;
      const appRole: Role =
        prismaRole === "ADMIN"
          ? "ADMIN"
          : prismaRole === "PRODUCER"
            ? "PRODUCER"
            : prismaRole === "CAREGIVER" || prismaRole === "CARE_SEEKER"
              ? "BUYER"
              : "BUYER";
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: appRole,
        zipCode: user.zipCode,
        primaryMode: user.primaryMode,
        isProducer: user.isProducer,
        isBuyer: user.isBuyer,
        isCaregiver: user.isCaregiver,
        isHomesteadOwner: user.isHomesteadOwner,
      };
    });

    let filtered = sessionUsers;
    if (capability) {
      filtered = sessionUsers.filter((user) => {
        const caps = getUserCapabilities(user);
        return (caps as UserCapabilities)[capability as keyof UserCapabilities] === true;
      });
    }

    const total = filtered.length;
    const skip = (page - 1) * pageSize;
    const items = filtered.slice(skip, skip + pageSize);

    return ok({ items, page, pageSize, total, users: items }, requestId);
  } catch (error) {
    logError("admin/users/GET", error, {
      requestId,
      path: "/api/admin/users",
      method: "GET",
    });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
