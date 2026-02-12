-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "flagged_at" TIMESTAMP(3),
ADD COLUMN     "flagged_for_admin" BOOLEAN NOT NULL DEFAULT false;
