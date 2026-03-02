-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "reminderDays" INTEGER[] DEFAULT ARRAY[30, 7]::INTEGER[];

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "notifEmail" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifPush" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notifWeekly" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "share_links" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vehicleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "share_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "share_links_token_key" ON "share_links"("token");

-- AddForeignKey
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
