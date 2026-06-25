-- Dernier kilométrage connu par type d'entretien (baselines manuels)
ALTER TABLE "vehicles" ADD COLUMN "maintenanceLastKm" JSONB;
