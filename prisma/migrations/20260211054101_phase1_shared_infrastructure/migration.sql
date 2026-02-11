/*
  Warnings:

  - Added the required column `revieweeId` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ReviewType" AS ENUM ('MARKET', 'CARE');

-- AlterTable: add new columns (revieweeId nullable first so we can backfill)
ALTER TABLE "Review" ADD COLUMN     "care_booking_id" TEXT,
ADD COLUMN     "revieweeId" TEXT,
ADD COLUMN     "type" "ReviewType" NOT NULL DEFAULT 'MARKET';

-- Backfill revieweeId from producerId for existing Market reviews
UPDATE "Review" SET "revieweeId" = "producerId" WHERE "revieweeId" IS NULL;

-- Now enforce NOT NULL and drop orderId NOT NULL
ALTER TABLE "Review" ALTER COLUMN "revieweeId" SET NOT NULL;
ALTER TABLE "Review" ALTER COLUMN "orderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isBuyer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isCaregiver" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isHomesteadOwner" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isProducer" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "userAId" TEXT NOT NULL,
    "userBId" TEXT NOT NULL,
    "orderId" TEXT,
    "care_booking_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
