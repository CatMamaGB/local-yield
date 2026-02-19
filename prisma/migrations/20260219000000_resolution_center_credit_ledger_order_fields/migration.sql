-- CreateEnum
CREATE TYPE "OrderDisputeProblemType" AS ENUM ('LATE', 'DAMAGED', 'MISSING', 'NOT_AS_DESCRIBED', 'WRONG_ITEM', 'OTHER');

-- CreateEnum
CREATE TYPE "OrderDisputeProposedOutcome" AS ENUM ('REFUND', 'PARTIAL_REFUND', 'REPLACEMENT', 'STORE_CREDIT', 'OTHER');

-- CreateEnum
CREATE TYPE "OrderDisputeResolutionOutcome" AS ENUM ('REFUND', 'PARTIAL_REFUND', 'STORE_CREDIT', 'RESOLVED_NO_REFUND', 'DISMISSED');

-- CreateEnum
CREATE TYPE "CreditLedgerReason" AS ENUM ('DISPUTE_RESOLUTION', 'GOODWILL', 'ADJUSTMENT', 'CREDIT_REDEMPTION');

-- AlterTable Order: credit + Stripe + idempotency
ALTER TABLE "Order" ADD COLUMN "credit_applied_cents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "stripe_charge_cents" INTEGER;
ALTER TABLE "Order" ADD COLUMN "stripe_payment_intent_id" TEXT;
ALTER TABLE "Order" ADD COLUMN "stripe_refunded_cents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "idempotency_key" TEXT;

-- AlterTable Report: assignment + order dispute fields
ALTER TABLE "Report" ADD COLUMN "assigned_to_id" TEXT;
ALTER TABLE "Report" ADD COLUMN "problem_type" "OrderDisputeProblemType";
ALTER TABLE "Report" ADD COLUMN "proposed_outcome" "OrderDisputeProposedOutcome";
ALTER TABLE "Report" ADD COLUMN "resolution_outcome" "OrderDisputeResolutionOutcome";
ALTER TABLE "Report" ADD COLUMN "resolution_note" TEXT;
ALTER TABLE "Report" ADD COLUMN "resolution_amount_cents" INTEGER;

-- CreateTable ReportAttachment
CREATE TABLE "ReportAttachment" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable CreditLedger
CREATE TABLE "CreditLedger" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "producer_id" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "reason" "CreditLedgerReason" NOT NULL,
    "order_id" TEXT,
    "report_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "CreditLedger_pkey" PRIMARY KEY ("id")
);

-- Unique constraint Order.idempotency_key (nullable unique)
CREATE UNIQUE INDEX "Order_idempotency_key_key" ON "Order"("idempotency_key");

-- Indexes
CREATE INDEX "Report_assigned_to_id_idx" ON "Report"("assigned_to_id");
CREATE INDEX "ReportAttachment_report_id_idx" ON "ReportAttachment"("report_id");
CREATE INDEX "CreditLedger_user_id_producer_id_idx" ON "CreditLedger"("user_id", "producer_id");
CREATE INDEX "CreditLedger_order_id_idx" ON "CreditLedger"("order_id");
CREATE INDEX "CreditLedger_report_id_idx" ON "CreditLedger"("report_id");

-- AddForeignKey Report.assignedToId
ALTER TABLE "Report" ADD CONSTRAINT "Report_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey ReportAttachment.reportId
ALTER TABLE "ReportAttachment" ADD CONSTRAINT "ReportAttachment_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey CreditLedger
ALTER TABLE "CreditLedger" ADD CONSTRAINT "CreditLedger_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreditLedger" ADD CONSTRAINT "CreditLedger_producer_id_fkey" FOREIGN KEY ("producer_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreditLedger" ADD CONSTRAINT "CreditLedger_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CreditLedger" ADD CONSTRAINT "CreditLedger_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add new notification types
ALTER TYPE "NotificationType" ADD VALUE 'STORE_CREDIT_ISSUED';
ALTER TYPE "NotificationType" ADD VALUE 'ORDER_PLACED';
ALTER TYPE "NotificationType" ADD VALUE 'ORDER_FULFILLED';
