/**
 * GET /api/care/caregivers?zip&radius&species&serviceType
 * Returns caregivers within radius with active listings matching filters.
 */

import { NextRequest } from "next/server";
import { listCaregiversByRadius } from "@/lib/care";
import { ZipSchema } from "@/lib/validators";
import { ok, fail } from "@/lib/api";
import { getRequestId } from "@/lib/request-id";
import { logError } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  try {
    const searchParams = request.nextUrl.searchParams;
    const zip = searchParams.get("zip");
    const radiusStr = searchParams.get("radius");
    const species = searchParams.get("species");
    const serviceType = searchParams.get("serviceType");

    if (!zip) return fail("ZIP code is required", "VALIDATION_ERROR", 400);

    const zipResult = ZipSchema.safeParse(zip);
    if (!zipResult.success) return fail("Invalid ZIP code", "VALIDATION_ERROR", 400);

    const radius = radiusStr ? parseInt(radiusStr, 10) : 25;
    if (isNaN(radius) || radius < 1 || radius > 100) {
      return fail("Radius must be between 1 and 100 miles", "VALIDATION_ERROR", 400);
    }

    const caregivers = await listCaregiversByRadius({
      zip: zipResult.data,
      radius,
      ...(species && { species: species as import("@prisma/client").AnimalSpecies }),
      ...(serviceType && { serviceType: serviceType as import("@prisma/client").CareServiceType }),
    });

    return ok({ caregivers });
  } catch (error) {
    logError("care/caregivers/GET", error, { requestId, path: "/api/care/caregivers", method: "GET" });
    return fail("Something went wrong", "INTERNAL_ERROR", 500, { requestId });
  }
}
