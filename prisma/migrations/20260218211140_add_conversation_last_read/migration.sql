-- CreateEnum
CREATE TYPE "CareBookingStatus" AS ENUM ('REQUESTED', 'ACCEPTED', 'DECLINED', 'CANCELED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CareServiceType" AS ENUM ('DROP_IN', 'OVERNIGHT', 'BOARDING', 'FARM_SITTING');

-- CreateEnum
CREATE TYPE "HelpExchangeCategory" AS ENUM ('FENCE_REPAIRS', 'GARDEN_HARVEST', 'EQUIPMENT_HELP');

-- CreateEnum
CREATE TYPE "HelpExchangeStatus" AS ENUM ('OPEN', 'FILLED', 'CLOSED');

-- CreateEnum
CREATE TYPE "AnimalSpecies" AS ENUM ('HORSES', 'CATTLE', 'GOATS', 'SHEEP', 'PIGS', 'POULTRY', 'ALPACAS', 'LLAMAS', 'DONKEYS', 'OTHER');

-- CreateEnum
CREATE TYPE "CareTaskType" AS ENUM ('FEEDING', 'WATERING', 'MUCKING', 'TURNOUT', 'MEDS_ORAL', 'MEDS_INJECTION', 'WOUND_CARE', 'HERD_CHECK', 'EGG_COLLECTION', 'MILKING', 'LAMBING_FOALING_SUPPORT', 'EQUIPMENT_USE', 'OTHER');

-- CreateEnum
CREATE TYPE "ExperienceBackground" AS ENUM ('GREW_UP_FARM', 'FAMILY_OPERATION', 'RANCH_WORK', 'BARN_MANAGER', 'VET_ASSISTANT', 'SHOW_CIRCUIT', 'SELF_TAUGHT', 'FORMAL_AG_EDU', 'FFA_4H', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('SPAM', 'INAPPROPRIATE_CONTENT', 'SCAM', 'HARASSMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BOOKING_REQUESTED', 'BOOKING_ACCEPTED', 'BOOKING_DECLINED', 'BOOKING_CANCELED', 'BOOKING_COMPLETED', 'NEW_MESSAGE', 'POSTING_CREATED');

-- AlterTable
ALTER TABLE "CareSeekerProfile" ADD COLUMN     "address_line_1" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "state" TEXT;

-- AlterTable
ALTER TABLE "CaregiverProfile" ADD COLUMN     "average_response_time_hours" DOUBLE PRECISION,
ADD COLUMN     "experienceBackground" "ExperienceBackground"[] DEFAULT ARRAY[]::"ExperienceBackground"[],
ADD COLUMN     "intro_audio_url" TEXT,
ADD COLUMN     "intro_video_url" TEXT,
ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "languages_spoken" TEXT,
ADD COLUMN     "references_text" TEXT,
ADD COLUMN     "speciesComfort" "AnimalSpecies"[] DEFAULT ARRAY[]::"AnimalSpecies"[],
ADD COLUMN     "tasksComfort" "CareTaskType"[] DEFAULT ARRAY[]::"CareTaskType"[],
ADD COLUMN     "years_experience" INTEGER;

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "user_a_last_read_at" TIMESTAMP(3),
ADD COLUMN     "user_b_last_read_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "CareServiceListing" (
    "id" TEXT NOT NULL,
    "caregiver_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "service_type" "CareServiceType" NOT NULL,
    "species_supported" "AnimalSpecies"[] DEFAULT ARRAY[]::"AnimalSpecies"[],
    "tasks_supported" "CareTaskType"[] DEFAULT ARRAY[]::"CareTaskType"[],
    "rate_cents" INTEGER NOT NULL,
    "rate_unit" TEXT NOT NULL,
    "service_radius_miles" INTEGER NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareServiceListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareBooking" (
    "id" TEXT NOT NULL,
    "care_seeker_id" TEXT NOT NULL,
    "caregiver_id" TEXT NOT NULL,
    "status" "CareBookingStatus" NOT NULL DEFAULT 'REQUESTED',
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "location_zip" TEXT NOT NULL,
    "species" "AnimalSpecies",
    "service_type" "CareServiceType",
    "total_cents" INTEGER NOT NULL DEFAULT 0,
    "idempotency_key" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelpExchangePosting" (
    "id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "HelpExchangeCategory" NOT NULL,
    "zip_code" TEXT NOT NULL,
    "radius_miles" INTEGER,
    "status" "HelpExchangeStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HelpExchangePosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "description" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by_id" TEXT,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestLog" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status_code" INTEGER NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "user_id" TEXT,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CareServiceListing_caregiver_id_idx" ON "CareServiceListing"("caregiver_id");

-- CreateIndex
CREATE INDEX "CareServiceListing_active_idx" ON "CareServiceListing"("active");

-- CreateIndex
CREATE UNIQUE INDEX "CareBooking_idempotency_key_key" ON "CareBooking"("idempotency_key");

-- CreateIndex
CREATE INDEX "CareBooking_care_seeker_id_idx" ON "CareBooking"("care_seeker_id");

-- CreateIndex
CREATE INDEX "CareBooking_caregiver_id_idx" ON "CareBooking"("caregiver_id");

-- CreateIndex
CREATE INDEX "CareBooking_status_idx" ON "CareBooking"("status");

-- CreateIndex
CREATE INDEX "CareBooking_caregiver_id_start_at_end_at_idx" ON "CareBooking"("caregiver_id", "start_at", "end_at");

-- CreateIndex
CREATE INDEX "HelpExchangePosting_status_idx" ON "HelpExchangePosting"("status");

-- CreateIndex
CREATE INDEX "HelpExchangePosting_zip_code_idx" ON "HelpExchangePosting"("zip_code");

-- CreateIndex
CREATE INDEX "HelpExchangePosting_created_by_id_idx" ON "HelpExchangePosting"("created_by_id");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "Report_entity_type_entity_id_idx" ON "Report"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt");

-- CreateIndex
CREATE INDEX "RequestLog_request_id_idx" ON "RequestLog"("request_id");

-- CreateIndex
CREATE INDEX "RequestLog_route_idx" ON "RequestLog"("route");

-- CreateIndex
CREATE INDEX "RequestLog_status_code_idx" ON "RequestLog"("status_code");

-- CreateIndex
CREATE INDEX "RequestLog_created_at_idx" ON "RequestLog"("created_at");

-- CreateIndex
CREATE INDEX "RequestLog_user_id_idx" ON "RequestLog"("user_id");

-- CreateIndex
CREATE INDEX "Notification_user_id_read_idx" ON "Notification"("user_id", "read");

-- CreateIndex
CREATE INDEX "Notification_created_at_idx" ON "Notification"("created_at");

-- CreateIndex
CREATE INDEX "Conversation_orderId_idx" ON "Conversation"("orderId");

-- CreateIndex
CREATE INDEX "Conversation_care_booking_id_idx" ON "Conversation"("care_booking_id");

-- CreateIndex
CREATE INDEX "Conversation_updatedAt_idx" ON "Conversation"("updatedAt");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX "Order_buyerId_idx" ON "Order"("buyerId");

-- CreateIndex
CREATE INDEX "Order_producerId_idx" ON "Order"("producerId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_order_id_idx" ON "OrderItem"("order_id");

-- CreateIndex
CREATE INDEX "OrderItem_product_id_idx" ON "OrderItem"("product_id");

-- CreateIndex
CREATE INDEX "Product_userId_idx" ON "Product"("userId");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Review_producerId_idx" ON "Review"("producerId");

-- CreateIndex
CREATE INDEX "Review_revieweeId_idx" ON "Review"("revieweeId");

-- CreateIndex
CREATE INDEX "Review_createdAt_idx" ON "Review"("createdAt");

-- CreateIndex
CREATE INDEX "Review_hiddenByAdmin_idx" ON "Review"("hiddenByAdmin");

-- CreateIndex
CREATE INDEX "Review_flagged_for_admin_idx" ON "Review"("flagged_for_admin");

-- AddForeignKey
ALTER TABLE "CareServiceListing" ADD CONSTRAINT "CareServiceListing_caregiver_id_fkey" FOREIGN KEY ("caregiver_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareBooking" ADD CONSTRAINT "CareBooking_care_seeker_id_fkey" FOREIGN KEY ("care_seeker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareBooking" ADD CONSTRAINT "CareBooking_caregiver_id_fkey" FOREIGN KEY ("caregiver_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpExchangePosting" ADD CONSTRAINT "HelpExchangePosting_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
