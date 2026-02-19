"use client";

/**
 * Client component that logs profile view telemetry on mount.
 */

import { useEffect } from "react";
import { logTelemetry } from "@/lib/telemetry/telemetry";
import type { CareProfileViewedEvent } from "@/lib/telemetry/events";

interface ProfileViewTrackerProps {
  caregiverId: string;
  viewerId?: string;
}

export function ProfileViewTracker({ caregiverId, viewerId }: ProfileViewTrackerProps) {
  useEffect(() => {
    const event: CareProfileViewedEvent = {
      event: "care_profile_viewed",
      caregiverId,
      viewerId,
    };
    logTelemetry(event);
  }, [caregiverId, viewerId]);

  return null;
}
