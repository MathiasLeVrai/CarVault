-- AlterTable
ALTER TABLE "share_links" ADD COLUMN     "hidePurchasePrice" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "label" TEXT,
ADD COLUMN     "lastViewedAt" TIMESTAMP(3),
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;
