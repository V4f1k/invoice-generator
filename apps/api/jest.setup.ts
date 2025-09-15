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

// Prisma Client will connect to real test database
// Individual tests can mock specific methods if needed

// Global test setup can be added here
console.log('Test environment loaded:', {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL?.substring(0, 50) + '...',
  JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET'
});