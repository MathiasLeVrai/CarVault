-- Add FINE to ExpenseCategory enum
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'FINE';
