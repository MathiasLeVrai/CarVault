-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('GASOLINE', 'DIESEL', 'HYBRID', 'ELECTRIC', 'LPG', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AlertType" ADD VALUE 'OIL_CHANGE';
ALTER TYPE "AlertType" ADD VALUE 'TIRE_SEASON';
ALTER TYPE "AlertType" ADD VALUE 'MILEAGE_SERVICE';

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "fuelType" "FuelType" NOT NULL DEFAULT 'GASOLINE',
ADD COLUMN     "purchasePrice" DOUBLE PRECISION;
