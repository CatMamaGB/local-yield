-- CreateTable
CREATE TABLE "ProductCategorySuggestionLog" (
    "id" TEXT NOT NULL,
    "normalized_title" TEXT NOT NULL,
    "suggested_category_id" TEXT NOT NULL,
    "chosen_category_id" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductCategorySuggestionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductCategorySuggestionLog_normalized_title_idx" ON "ProductCategorySuggestionLog"("normalized_title");

-- CreateIndex
CREATE INDEX "ProductCategorySuggestionLog_createdAt_idx" ON "ProductCategorySuggestionLog"("createdAt");
