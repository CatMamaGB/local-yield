-- CreateEnum
CREATE TYPE "HelpExchangeBidStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateTable
CREATE TABLE "HelpExchangeBid" (
    "id" TEXT NOT NULL,
    "posting_id" TEXT NOT NULL,
    "bidder_id" TEXT NOT NULL,
    "message" TEXT,
    "status" "HelpExchangeBidStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HelpExchangeBid_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HelpExchangeBid_posting_id_idx" ON "HelpExchangeBid"("posting_id");

-- CreateIndex
CREATE INDEX "HelpExchangeBid_bidder_id_idx" ON "HelpExchangeBid"("bidder_id");

-- CreateIndex
CREATE UNIQUE INDEX "HelpExchangeBid_posting_id_bidder_id_key" ON "HelpExchangeBid"("posting_id", "bidder_id");

-- AddForeignKey
ALTER TABLE "HelpExchangeBid" ADD CONSTRAINT "HelpExchangeBid_posting_id_fkey" FOREIGN KEY ("posting_id") REFERENCES "HelpExchangePosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpExchangeBid" ADD CONSTRAINT "HelpExchangeBid_bidder_id_fkey" FOREIGN KEY ("bidder_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
