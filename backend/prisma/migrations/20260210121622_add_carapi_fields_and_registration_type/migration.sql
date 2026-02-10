-- AlterEnum
ALTER TYPE "DocumentType" ADD VALUE 'REGISTRATION';

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "bodyType" TEXT,
ADD COLUMN     "carapiTrimId" INTEGER,
ADD COLUMN     "doors" INTEGER,
ADD COLUMN     "engineSize" DOUBLE PRECISION,
ADD COLUMN     "horsepower" INTEGER,
ADD COLUMN     "msrp" DOUBLE PRECISION,
ADD COLUMN     "transmission" TEXT;
