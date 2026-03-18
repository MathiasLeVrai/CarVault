-- AlterTable
ALTER TABLE "expenses" ALTER COLUMN "category" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "alerts_userId_idx" ON "alerts"("userId");

-- CreateIndex
CREATE INDEX "documents_vehicleId_idx" ON "documents"("vehicleId");

-- CreateIndex
CREATE INDEX "expenses_vehicleId_date_idx" ON "expenses"("vehicleId", "date");

-- CreateIndex
CREATE INDEX "mileage_entries_vehicleId_idx" ON "mileage_entries"("vehicleId");

-- CreateIndex
CREATE INDEX "vehicles_userId_idx" ON "vehicles"("userId");
