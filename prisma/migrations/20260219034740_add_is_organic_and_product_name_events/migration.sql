-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "is_organic" BOOLEAN;

-- CreateTable
CREATE TABLE "ProductNameEvent" (
    "id" TEXT NOT NULL,
    "raw_name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductNameEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductNameEvent_normalized_name_idx" ON "ProductNameEvent"("normalized_name");

-- CreateIndex
CREATE INDEX "ProductNameEvent_createdAt_idx" ON "ProductNameEvent"("createdAt");
