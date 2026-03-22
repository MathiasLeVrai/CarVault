-- AlterEnum
ALTER TYPE "AlertType" ADD VALUE 'ZFE_RESTRICTION';

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "co2" INTEGER,
ADD COLUMN     "critAir" INTEGER,
ADD COLUMN     "firstRegistrationDate" TIMESTAMP(3),
ADD COLUMN     "fiscalPower" INTEGER;
