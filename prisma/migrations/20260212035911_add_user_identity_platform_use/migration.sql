-- CreateEnum
CREATE TYPE "PlatformUse" AS ENUM ('BUY_LOCAL_GOODS', 'SELL_PRODUCTS', 'FIND_ANIMAL_CARE', 'OFFER_ANIMAL_CARE', 'BOTH_MARKET_AND_CARE', 'OTHER');

-- AlterTable: add columns nullable first
ALTER TABLE "User" ADD COLUMN "phone" TEXT;
ALTER TABLE "User" ADD COLUMN "address_line_1" TEXT;
ALTER TABLE "User" ADD COLUMN "city" TEXT;
ALTER TABLE "User" ADD COLUMN "state" TEXT;
ALTER TABLE "User" ADD COLUMN "platform_use" "PlatformUse";

-- Backfill existing rows
UPDATE "User" SET "phone" = '' WHERE "phone" IS NULL;
UPDATE "User" SET "platform_use" = 'OTHER' WHERE "platform_use" IS NULL;

-- Enforce NOT NULL
ALTER TABLE "User" ALTER COLUMN "phone" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "platform_use" SET NOT NULL;
