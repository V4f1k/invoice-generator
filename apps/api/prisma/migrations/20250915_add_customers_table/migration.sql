-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "zip_code" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Czech Republic',
    "ico" TEXT,
    "dic" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- Update invoices table to match the new schema
ALTER TABLE "invoices" DROP COLUMN IF EXISTS "client_address";
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "invoice_number" BIGINT;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "customer_id" TEXT;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "client_street" TEXT;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "client_city" TEXT;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "client_zip_code" TEXT;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "client_country" TEXT DEFAULT 'Czech Republic';
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "duzp" TIMESTAMP(3);
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "vat_amount" NUMERIC(10,2) DEFAULT 0;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "is_reverse_charge" BOOLEAN DEFAULT false;

-- Update invoice_items table if needed
ALTER TABLE "invoice_items" ADD COLUMN IF NOT EXISTS "vat_rate" NUMERIC(5,2);

-- Set NOT NULL constraints after adding columns and populating data
UPDATE "invoices" SET
  "invoice_number" = COALESCE("invoice_number", EXTRACT(EPOCH FROM NOW())::BIGINT),
  "client_street" = COALESCE("client_street", ''),
  "client_city" = COALESCE("client_city", ''),
  "client_zip_code" = COALESCE("client_zip_code", '');

ALTER TABLE "invoices" ALTER COLUMN "invoice_number" SET NOT NULL;
ALTER TABLE "invoices" ALTER COLUMN "client_street" SET NOT NULL;
ALTER TABLE "invoices" ALTER COLUMN "client_city" SET NOT NULL;
ALTER TABLE "invoices" ALTER COLUMN "client_zip_code" SET NOT NULL;
ALTER TABLE "invoices" ALTER COLUMN "client_country" SET NOT NULL;

-- Add unique constraint for invoice number per supplier
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_supplier_id_invoice_number_key" UNIQUE ("supplier_id", "invoice_number");

-- Add foreign keys
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;