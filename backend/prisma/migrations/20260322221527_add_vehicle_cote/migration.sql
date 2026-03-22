-- CreateTable
CREATE TABLE "vehicle_cotes" (
    "id" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "low" DOUBLE PRECISION NOT NULL,
    "mid" DOUBLE PRECISION NOT NULL,
    "high" DOUBLE PRECISION NOT NULL,
    "raw" JSONB,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_cotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_cotes_plate_key" ON "vehicle_cotes"("plate");
