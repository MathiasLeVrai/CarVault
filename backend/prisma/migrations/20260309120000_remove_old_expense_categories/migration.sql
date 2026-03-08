-- Migrate existing expenses with removed categories to OTHER
UPDATE "expenses"
SET "category" = 'OTHER'
WHERE "category"::text IN (
  'FUEL', 'INSURANCE', 'REPAIR', 'BATTERY', 'WINDSHIELD',
  'REGISTRATION', 'CLEANING', 'ACCESSORIES'
);

-- Create new enum with only the 9 allowed categories
CREATE TYPE "ExpenseCategory_new" AS ENUM (
  'MAINTENANCE', 'OIL_CHANGE', 'BRAKES', 'TIRES', 'BODYWORK',
  'TECHNICAL_INSPECTION', 'PARKING', 'TOLL', 'OTHER'
);

-- Switch column to new type (all current values exist in new enum)
ALTER TABLE "expenses" ALTER COLUMN "category" DROP DEFAULT;
ALTER TABLE "expenses"
  ALTER COLUMN "category" TYPE "ExpenseCategory_new"
  USING ("category"::text::"ExpenseCategory_new");

-- Replace old type
DROP TYPE "ExpenseCategory";
ALTER TYPE "ExpenseCategory_new" RENAME TO "ExpenseCategory";

-- Restore default
ALTER TABLE "expenses" ALTER COLUMN "category" SET DEFAULT 'MAINTENANCE'::"ExpenseCategory";
