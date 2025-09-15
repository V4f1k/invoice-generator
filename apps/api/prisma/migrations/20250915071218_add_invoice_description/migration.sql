/*
  Warnings:

  - Made the column `vat_amount` on table `invoices` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_reverse_charge` on table `invoices` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_non_vat_payer` on table `suppliers` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."invoices" ADD COLUMN     "description" TEXT,
ALTER COLUMN "vat_amount" SET NOT NULL,
ALTER COLUMN "is_reverse_charge" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."suppliers" ALTER COLUMN "is_non_vat_payer" SET NOT NULL;
