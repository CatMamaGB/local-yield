"use client";

/**
 * Actions for caregiver profile page (Report button).
 */

import { useState } from "react";
import { ReportDialog } from "@/components/ReportDialog";

interface CaregiverActionsProps {
  caregiverId: string;
}

export function CaregiverActions({ caregiverId }: CaregiverActionsProps) {
  const [showReportDialog, setShowReportDialog] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowReportDialog(true)}
        className="rounded-lg border border-brand/20 px-4 py-2 text-sm font-medium text-brand transition hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
      >
        Report
      </button>
      {showReportDialog && (
        <ReportDialog
          entityType="caregiver"
          entityId={caregiverId}
          onClose={() => setShowReportDialog(false)}
          onSuccess={() => {
            // Could show a success toast here
          }}
        />
      )}
    </>
  );
}
