-- Prisma generated "DROP COLUMN + ADD COLUMN" here, which would delete the data.
-- A rename keeps it, so this migration was edited by hand.
ALTER TABLE "Expense" RENAME COLUMN "receiptUrl" TO "receiptPath";
