-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'FULFILLED', 'CANCELED', 'REFUNDED');
CREATE TYPE "FulfillmentType" AS ENUM ('PICKUP', 'DELIVERY');

-- AlterTable User: add clerk_id for auth provider sync
ALTER TABLE "User" ADD COLUMN "clerk_id" TEXT;

-- Unique constraint for clerk_id (allow nulls)
CREATE UNIQUE INDEX "User_clerk_id_key" ON "User"("clerk_id");

-- CreateTable ProducerProfile
CREATE TABLE "ProducerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "offersDelivery" BOOLEAN NOT NULL DEFAULT false,
    "deliveryFeeCents" INTEGER NOT NULL DEFAULT 0,
    "pickupNotes" TEXT,
    "pickupZipCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProducerProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProducerProfile_userId_key" ON "ProducerProfile"("userId");

-- AlterTable Product: add quantity_available (null = unlimited)
ALTER TABLE "Product" ADD COLUMN "quantity_available" INTEGER;

-- AlterTable Order: add new columns
ALTER TABLE "Order" ADD COLUMN "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "fulfillment_type" "FulfillmentType" NOT NULL DEFAULT 'PICKUP',
ADD COLUMN "delivery_fee_cents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "total_cents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "paid_at" TIMESTAMP(3),
ADD COLUMN "fulfilled_at" TIMESTAMP(3),
ADD COLUMN "stripe_session_id" TEXT;

-- Backfill total_cents from product price for existing orders (one product per order)
UPDATE "Order" o SET "total_cents" = (SELECT ROUND(p.price * 100)::INTEGER FROM "Product" p WHERE p.id = o."productId") WHERE o."productId" IS NOT NULL;

-- Make productId and pickupDate nullable for new order flow
ALTER TABLE "Order" ALTER COLUMN "productId" DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "pickupDate" DROP NOT NULL;

-- CreateTable OrderItem
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price_cents" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey ProducerProfile -> User
ALTER TABLE "ProducerProfile" ADD CONSTRAINT "ProducerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey OrderItem -> Order, Product
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
