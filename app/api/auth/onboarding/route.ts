/**
 * POST /api/auth/onboarding — Sets ZIP, roles, primaryMode; creates role profiles; sets onboardedAt.
 * Body: { zipCode: string, roles?: ("BUYER"|"PRODUCER"|"CAREGIVER"|"CARE_SEEKER")[], primaryMode?: "MARKET"|"SELL"|"CARE" }.
 * Admin is never set via onboarding. Redirect uses getPostOnboardingRedirect.
 */

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPostOnboardingRedirect } from "@/lib/redirects";
import { ok, fail, parseJsonBody } from "@/lib/api";
import { OnboardingSchema } from "@/lib/validators";
import { Role, PrimaryMode } from "@prisma/client";

const SIGNUP_TO_PRISMA_ROLE: Record<string, Role> = {
  BUYER: Role.BUYER,
  PRODUCER: Role.PRODUCER,
  CAREGIVER: Role.CAREGIVER,
  CARE_SEEKER: Role.CARE_SEEKER,
};

export async function POST(request: NextRequest) {
  try {
    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) return fail(parseError, "INVALID_JSON", 400);

    const validationResult = OnboardingSchema.safeParse(body);
    if (!validationResult.success) {
      return fail("Valid 5-digit ZIP code required", "INVALID_ZIP", 400);
    }
    const { zipCode: zip, roles: roleIds, primaryMode } = validationResult.data;

    const user = await getCurrentUser();
    if (!user) return fail("Unauthorized", "UNAUTHORIZED", 401);

    const isBuyer = roleIds != null && roleIds.length > 0 ? roleIds.includes("BUYER") : undefined;
    const isProducer = roleIds != null && roleIds.length > 0 ? roleIds.includes("PRODUCER") : undefined;
    const isCaregiver = roleIds != null && roleIds.length > 0 ? roleIds.includes("CAREGIVER") : undefined;
    const isHomesteadOwner = roleIds != null && roleIds.length > 0 ? roleIds.includes("CARE_SEEKER") : undefined;

    const updateData: {
      zipCode: string;
      onboardedAt: Date;
      primaryMode?: PrimaryMode;
      role?: Role;
      isBuyer?: boolean;
      isProducer?: boolean;
      isCaregiver?: boolean;
      isHomesteadOwner?: boolean;
    } = { zipCode: zip, onboardedAt: new Date() };
    
    if (primaryMode) {
      updateData.primaryMode = primaryMode === "MARKET" ? PrimaryMode.MARKET
        : primaryMode === "SELL" ? PrimaryMode.SELL
        : PrimaryMode.CARE;
    }
    
    if (roleIds != null && roleIds.length > 0) {
      updateData.isBuyer = isBuyer ?? false;
      updateData.isProducer = isProducer ?? false;
      updateData.isCaregiver = isCaregiver ?? false;
      updateData.isHomesteadOwner = isHomesteadOwner ?? false;
      updateData.role = isProducer ? Role.PRODUCER : Role.BUYER;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: user.id },
        data: updateData,
      });

      if (roleIds != null && roleIds.length > 0) {
        await tx.userRole.deleteMany({ where: { userId: user.id } });
        for (const r of roleIds) {
          const prismaRole = SIGNUP_TO_PRISMA_ROLE[r];
          if (prismaRole) await tx.userRole.create({ data: { userId: user.id, role: prismaRole } });
        }
      }

      if (isProducer) {
        await tx.producerProfile.upsert({
          where: { userId: user.id },
          create: { userId: user.id },
          update: {},
        });
      }
      if (isCaregiver) {
        await tx.caregiverProfile.upsert({
          where: { userId: user.id },
          create: { userId: user.id },
          update: {},
        });
      }
      if (isHomesteadOwner) {
        await tx.careSeekerProfile.upsert({
          where: { userId: user.id },
          create: { userId: user.id },
          update: {},
        });
      }

      return u;
    });

    const redirectPath = getPostOnboardingRedirect({
      primaryMode: updated.primaryMode,
      role: updated.role,
      isProducer: updated.isProducer,
      isCaregiver: updated.isCaregiver,
      isHomesteadOwner: updated.isHomesteadOwner,
    });
    const res = ok({ redirect: redirectPath });
    res.cookies.set("__dev_zip", zip, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch (error) {
    console.error("Onboarding error:", error);
    return fail("Failed to save ZIP code", "INTERNAL_ERROR", 500);
  }
}
