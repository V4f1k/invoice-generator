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
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'test-invoice-id' }),
      update: jest.fn().mockResolvedValue({ id: 'test-invoice-id' }),
      delete: jest.fn().mockResolvedValue({ id: 'test-invoice-id' }),
      count: jest.fn().mockResolvedValue(0),
    },
    invoiceItem: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'test-item-id' }),
      update: jest.fn().mockResolvedValue({ id: 'test-item-id' }),
      delete: jest.fn().mockResolvedValue({ id: 'test-item-id' }),
    },
    customer: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'test-customer-id' }),
      update: jest.fn().mockResolvedValue({ id: 'test-customer-id' }),
      delete: jest.fn().mockResolvedValue({ id: 'test-customer-id' }),
    },
    supplier: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'test-supplier-id' }),
      update: jest.fn().mockResolvedValue({ id: 'test-supplier-id' }),
      delete: jest.fn().mockResolvedValue({ id: 'test-supplier-id' }),
    },
    user: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'test-user-id' }),
      update: jest.fn().mockResolvedValue({ id: 'test-user-id' }),
      delete: jest.fn().mockResolvedValue({ id: 'test-user-id' }),
    },
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $connect: jest.fn().mockResolvedValue(undefined),
    $queryRaw: jest.fn().mockResolvedValue([]),
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