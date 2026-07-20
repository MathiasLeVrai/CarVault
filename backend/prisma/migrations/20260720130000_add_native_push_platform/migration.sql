-- CreateEnum
CREATE TYPE "PlateformePush" AS ENUM ('WEB', 'IOS');

-- AlterTable
ALTER TABLE "abonnements_push"
  ADD COLUMN "platform" "PlateformePush" NOT NULL DEFAULT 'WEB',
  ALTER COLUMN "p256dh" DROP NOT NULL,
  ALTER COLUMN "auth" DROP NOT NULL;
