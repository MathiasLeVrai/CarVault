-- Migrate existing FUEL expenses to OTHER
UPDATE "expenses" SET "category" = 'OTHER' WHERE "category" = 'FUEL';

-- Add new enum values
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'OIL_CHANGE';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'BRAKES';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'BATTERY';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'BODYWORK';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'WINDSHIELD';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'TECHNICAL_INSPECTION';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'REGISTRATION';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'CLEANING';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'ACCESSORIES';

-- Recreate enum without FUEL (PostgreSQL requires recreating the type)
-- Since we can't remove values from enums in PostgreSQL easily,
-- we keep FUEL in the DB enum but remove it from the app code.
-- This is safe: no rows use FUEL anymore, and the schema won't expose it.
