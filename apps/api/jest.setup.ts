import * as dotenv from 'dotenv';
import { join } from 'path';

// Load test environment variables
const testEnvPath = join(__dirname, '.env.test');
dotenv.config({ path: testEnvPath });

// Ensure NODE_ENV is set to test
process.env.NODE_ENV = 'test';

// Ensure we have a test database URL
if (!process.env.DATABASE_URL?.includes('test')) {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/invoice_generator_test?schema=public';
}

// Set JWT secret for tests
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret';
}

// Mock PrismaClient for tests to avoid database connection issues
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    invoice: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'test-invoice-id-1',
          invoiceNumber: BigInt('250115001'),
          clientName: 'Test Client 1',
          clientStreet: 'Test Street 1',
          clientCity: 'Test City',
          clientZipCode: '12345',
          clientCountry: 'Czech Republic',
          subtotal: { toNumber: () => 100 },
          vatAmount: { toNumber: () => 21 },
          total: { toNumber: () => 121 },
          isReverseCharge: false,
          items: [
            {
              id: 'test-item-id-1',
              description: 'Test Item 1',
              quantity: { toNumber: () => 1 },
              unitPrice: { toNumber: () => 100 },
              lineTotal: { toNumber: () => 100 },
              vatRate: { toNumber: () => 21 }
            }
          ],
          supplier: {
            id: 'test-supplier-id',
            name: 'Test Supplier',
            street: 'Supplier Street',
            city: 'Supplier City',
            zipCode: '54321',
            country: 'Czech Republic',
            address: 'Supplier Street\n54321 Supplier City\nCzech Republic'
          },
          customer: null
        }
      ]),
      findUnique: jest.fn().mockResolvedValue({
        id: 'test-invoice-id',
        invoiceNumber: BigInt('250115001'),
        clientName: 'Test Client',
        clientStreet: 'Test Street',
        clientCity: 'Test City',
        clientZipCode: '12345',
        clientCountry: 'Czech Republic',
        subtotal: { toNumber: () => 100 },
        vatAmount: { toNumber: () => 21 },
        total: { toNumber: () => 121 },
        isReverseCharge: false,
        items: [
          {
            id: 'test-item-id',
            description: 'Test Item',
            quantity: { toNumber: () => 1 },
            unitPrice: { toNumber: () => 100 },
            lineTotal: { toNumber: () => 100 },
            vatRate: { toNumber: () => 21 }
          }
        ],
        supplier: {
          id: 'test-supplier-id',
          name: 'Test Supplier',
          street: 'Supplier Street',
          city: 'Supplier City',
          zipCode: '54321',
          country: 'Czech Republic',
          address: 'Supplier Street\n54321 Supplier City\nCzech Republic'
        },
        customer: null
      }),
      create: jest.fn().mockResolvedValue({
        id: 'test-invoice-id',
        invoiceNumber: BigInt('250115001'),
        clientName: 'Test Client',
        clientStreet: 'Test Street',
        clientCity: 'Test City',
        clientZipCode: '12345',
        clientCountry: 'Czech Republic',
        subtotal: { toNumber: () => 100 },
        vatAmount: { toNumber: () => 21 },
        total: { toNumber: () => 121 },
        isReverseCharge: false,
        items: [
          {
            id: 'test-item-id',
            description: 'Test Item',
            quantity: { toNumber: () => 1 },
            unitPrice: { toNumber: () => 100 },
            lineTotal: { toNumber: () => 100 },
            vatRate: { toNumber: () => 21 }
          }
        ],
        supplier: {
          id: 'test-supplier-id',
          name: 'Test Supplier',
          street: 'Supplier Street',
          city: 'Supplier City',
          zipCode: '54321',
          country: 'Czech Republic',
          address: 'Supplier Street\n54321 Supplier City\nCzech Republic'
        },
        customer: null
      }),
      update: jest.fn().mockResolvedValue({
        id: 'test-invoice-id',
        items: [],
        subtotal: { toNumber: () => 0 },
        vatAmount: { toNumber: () => 0 },
        total: { toNumber: () => 0 }
      }),
      delete: jest.fn().mockResolvedValue({ id: 'test-invoice-id' }),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      count: jest.fn().mockResolvedValue(0),
    },
    invoiceItem: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'test-item-id' }),
      update: jest.fn().mockResolvedValue({ id: 'test-item-id' }),
      delete: jest.fn().mockResolvedValue({ id: 'test-item-id' }),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    customer: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'test-customer-id' }),
      update: jest.fn().mockResolvedValue({ id: 'test-customer-id' }),
      delete: jest.fn().mockResolvedValue({ id: 'test-customer-id' }),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    supplier: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'test-supplier-id' }),
      update: jest.fn().mockResolvedValue({ id: 'test-supplier-id' }),
      delete: jest.fn().mockResolvedValue({ id: 'test-supplier-id' }),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    user: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'test-user-id' }),
      update: jest.fn().mockResolvedValue({ id: 'test-user-id' }),
      delete: jest.fn().mockResolvedValue({ id: 'test-user-id' }),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $connect: jest.fn().mockResolvedValue(undefined),
    $queryRaw: jest.fn().mockImplementation((query) => {
      const queryStr = query.strings?.[0] || query.toString?.() || '';

      // Mock responses for different schema queries
      if (queryStr.includes('information_schema.columns') && queryStr.includes('invoices')) {
        // Check if it's specifically querying for monetary fields
        if (queryStr.includes("('subtotal', 'total')") || queryStr.includes("('subtotal', 'vat_amount', 'total')")) {
          return Promise.resolve([
            { column_name: 'subtotal', data_type: 'numeric', numeric_precision: 10, numeric_scale: 2 },
            { column_name: 'total', data_type: 'numeric', numeric_precision: 10, numeric_scale: 2 },
          ]);
        }

        // Return all columns for invoices table
        return Promise.resolve([
          { column_name: 'id', data_type: 'text', is_nullable: 'NO', numeric_precision: null, numeric_scale: null },
          { column_name: 'invoice_number', data_type: 'bigint', is_nullable: 'NO', numeric_precision: 64, numeric_scale: 0 },
          { column_name: 'supplier_id', data_type: 'text', is_nullable: 'NO', numeric_precision: null, numeric_scale: null },
          { column_name: 'customer_id', data_type: 'text', is_nullable: 'YES', numeric_precision: null, numeric_scale: null },
          { column_name: 'client_name', data_type: 'text', is_nullable: 'NO', numeric_precision: null, numeric_scale: null },
          { column_name: 'client_street', data_type: 'text', is_nullable: 'NO', numeric_precision: null, numeric_scale: null },
          { column_name: 'client_city', data_type: 'text', is_nullable: 'NO', numeric_precision: null, numeric_scale: null },
          { column_name: 'client_zip_code', data_type: 'text', is_nullable: 'NO', numeric_precision: null, numeric_scale: null },
          { column_name: 'client_country', data_type: 'text', is_nullable: 'NO', numeric_precision: null, numeric_scale: null },
          { column_name: 'issue_date', data_type: 'timestamp', is_nullable: 'NO', numeric_precision: null, numeric_scale: null },
          { column_name: 'due_date', data_type: 'timestamp', is_nullable: 'NO', numeric_precision: null, numeric_scale: null },
          { column_name: 'duzp', data_type: 'timestamp', is_nullable: 'YES', numeric_precision: null, numeric_scale: null },
          { column_name: 'description', data_type: 'text', is_nullable: 'YES', numeric_precision: null, numeric_scale: null },
          { column_name: 'subtotal', data_type: 'numeric', is_nullable: 'NO', numeric_precision: 10, numeric_scale: 2 },
          { column_name: 'vat_amount', data_type: 'numeric', is_nullable: 'NO', numeric_precision: 10, numeric_scale: 2 },
          { column_name: 'total', data_type: 'numeric', is_nullable: 'NO', numeric_precision: 10, numeric_scale: 2 },
          { column_name: 'is_reverse_charge', data_type: 'boolean', is_nullable: 'NO', numeric_precision: null, numeric_scale: null },
          { column_name: 'created_at', data_type: 'timestamp', is_nullable: 'NO', numeric_precision: null, numeric_scale: null },
          { column_name: 'updated_at', data_type: 'timestamp', is_nullable: 'NO', numeric_precision: null, numeric_scale: null },
        ]);
      } else if (queryStr.includes('information_schema.columns') && queryStr.includes('invoice_items')) {
        // Check for decimal fields query
        if (queryStr.includes("('quantity', 'unit_price', 'line_total')")) {
          return Promise.resolve([
            { column_name: 'quantity', data_type: 'numeric', numeric_precision: 10, numeric_scale: 2 },
            { column_name: 'unit_price', data_type: 'numeric', numeric_precision: 10, numeric_scale: 2 },
            { column_name: 'line_total', data_type: 'numeric', numeric_precision: 10, numeric_scale: 2 },
          ]);
        }

        // Return all columns for invoice_items table
        return Promise.resolve([
          { column_name: 'id', data_type: 'text', is_nullable: 'NO', numeric_precision: null, numeric_scale: null },
          { column_name: 'invoice_id', data_type: 'text', is_nullable: 'NO', numeric_precision: null, numeric_scale: null },
          { column_name: 'description', data_type: 'text', is_nullable: 'NO', numeric_precision: null, numeric_scale: null },
          { column_name: 'quantity', data_type: 'numeric', is_nullable: 'NO', numeric_precision: 10, numeric_scale: 2 },
          { column_name: 'unit_price', data_type: 'numeric', is_nullable: 'NO', numeric_precision: 10, numeric_scale: 2 },
          { column_name: 'line_total', data_type: 'numeric', is_nullable: 'NO', numeric_precision: 10, numeric_scale: 2 },
          { column_name: 'vat_rate', data_type: 'numeric', is_nullable: 'YES', numeric_precision: 5, numeric_scale: 2 },
          { column_name: 'created_at', data_type: 'timestamp', is_nullable: 'NO', numeric_precision: null, numeric_scale: null },
          { column_name: 'updated_at', data_type: 'timestamp', is_nullable: 'NO', numeric_precision: null, numeric_scale: null },
        ]);
      } else if (queryStr.includes('table_constraints') && queryStr.includes('FOREIGN KEY')) {
        // Mock foreign key constraint queries
        if (queryStr.includes('invoice_items')) {
          return Promise.resolve([
            {
              constraint_name: 'fk_invoice_items_invoice_id',
              column_name: 'invoice_id',
              referenced_table: 'invoices',
              referenced_column: 'id'
            },
          ]);
        } else if (queryStr.includes('invoices')) {
          return Promise.resolve([
            {
              constraint_name: 'fk_invoices_supplier_id',
              column_name: 'supplier_id',
              referenced_table: 'suppliers',
              referenced_column: 'id'
            },
          ]);
        }
      }

      // Default empty response for other queries
      return Promise.resolve([]);
    }),
    $executeRaw: jest.fn().mockResolvedValue(0),
    $transaction: jest.fn().mockImplementation((callback) => callback(mockPrisma)),
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

// Global test setup can be added here
console.log('Test environment loaded:', {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL?.substring(0, 50) + '...',
  JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET'
});