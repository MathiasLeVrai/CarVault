-- Track the odometer value at purchase/import time to compute stats
-- from the ownership period instead of from 0 km.
ALTER TABLE "vehicles"
ADD COLUMN "purchaseMileage" INTEGER;

UPDATE "vehicles"
SET "purchaseMileage" = "mileage"
WHERE "purchaseMileage" IS NULL;
