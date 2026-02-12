-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "event_hours" TEXT;

-- AlterTable
ALTER TABLE "ProducerProfile" ADD COLUMN     "about_us" TEXT,
ADD COLUMN     "accept_in_app_messages_only" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "availability_hours" TEXT,
ADD COLUMN     "contact_email" TEXT,
ADD COLUMN     "general_location" TEXT,
ADD COLUMN     "profile_image_url" TEXT,
ADD COLUMN     "story" TEXT;
