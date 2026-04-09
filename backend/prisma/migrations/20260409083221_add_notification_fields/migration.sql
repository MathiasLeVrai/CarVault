-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AlertType" ADD VALUE 'BUDGET_SPIKE';
ALTER TYPE "AlertType" ADD VALUE 'COST_PER_KM';
ALTER TYPE "AlertType" ADD VALUE 'FUEL_BUDGET_EXCEEDED';
ALTER TYPE "AlertType" ADD VALUE 'KM_RECORD';
ALTER TYPE "AlertType" ADD VALUE 'CO2_MALUS';

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "annualKmGoal" INTEGER,
ADD COLUMN     "monthlyFuelBudget" DOUBLE PRECISION;
