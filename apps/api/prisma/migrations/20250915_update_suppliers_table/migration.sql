-- AlterTable
ALTER TABLE "suppliers" DROP COLUMN "address";
ALTER TABLE "suppliers" ADD COLUMN "street" TEXT;
ALTER TABLE "suppliers" ADD COLUMN "city" TEXT;
ALTER TABLE "suppliers" ADD COLUMN "zip_code" TEXT;
ALTER TABLE "suppliers" ADD COLUMN "country" TEXT DEFAULT 'Czech Republic';
ALTER TABLE "suppliers" ADD COLUMN "bank_account" TEXT;
ALTER TABLE "suppliers" ADD COLUMN "is_non_vat_payer" BOOLEAN DEFAULT false;
ALTER TABLE "suppliers" ADD COLUMN "registration_type" TEXT;
ALTER TABLE "suppliers" ADD COLUMN "registration_court" TEXT;
ALTER TABLE "suppliers" ADD COLUMN "registration_file_number" TEXT;
ALTER TABLE "suppliers" ADD COLUMN "automatic_legal_text" TEXT;

-- Update existing NOT NULL constraints after adding columns
UPDATE "suppliers" SET
  "street" = '',
  "city" = '',
  "zip_code" = ''
WHERE "street" IS NULL OR "city" IS NULL OR "zip_code" IS NULL;

ALTER TABLE "suppliers" ALTER COLUMN "street" SET NOT NULL;
ALTER TABLE "suppliers" ALTER COLUMN "city" SET NOT NULL;
ALTER TABLE "suppliers" ALTER COLUMN "zip_code" SET NOT NULL;
ALTER TABLE "suppliers" ALTER COLUMN "country" SET NOT NULL;