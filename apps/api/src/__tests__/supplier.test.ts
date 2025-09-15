import request from 'supertest';
import app from '../index';
import { prisma } from '../utils/prisma';
import { generateToken } from '../utils/auth';

// Test data
const testUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  passwordHash: 'hashedpassword',
};

const validSupplierData = {
  name: 'Test Company s.r.o.',
  street: 'Test Street 123',
  city: 'Test City',
  zipCode: '12345',
  country: 'Czech Republic',
  ico: '12345678',
  dic: 'CZ12345678',
  bankAccount: 'CZ6508000000192000145399',
  isNonVatPayer: false,
};

describe('Supplier API Endpoints', () => {
  let authToken: string;

  beforeAll(async () => {
    // Create test user
    await prisma.user.create({
      data: testUser,
    });

    // Generate auth token
    authToken = generateToken(testUser.id);
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.supplier.deleteMany({
      where: { userId: testUser.id },
    });
    await prisma.user.deleteMany({
      where: { id: testUser.id },
    });
  });

  beforeEach(async () => {
    // Clean up any existing supplier data before each test
    await prisma.supplier.deleteMany({
      where: { userId: testUser.id },
    });
  });

  describe('GET /api/v1/supplier', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/v1/supplier');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized - No token provided');
    });

    it('should return null when no supplier info exists', async () => {
      const response = await request(app)
        .get('/api/v1/supplier')
        .set('Cookie', [`token=${authToken}`]);

      expect(response.status).toBe(200);
      expect(response.body).toBe(null);
    });

    it('should return supplier info when it exists', async () => {
      // Create supplier data
      const supplier = await prisma.supplier.create({
        data: {
          ...validSupplierData,
          userId: testUser.id,
        },
      });

      const response = await request(app)
        .get('/api/v1/supplier')
        .set('Cookie', [`token=${authToken}`]);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: supplier.id,
        userId: testUser.id,
        name: validSupplierData.name,
        street: validSupplierData.street,
        city: validSupplierData.city,
        zipCode: validSupplierData.zipCode,
        country: validSupplierData.country,
        ico: validSupplierData.ico,
        dic: validSupplierData.dic,
        bankAccount: validSupplierData.bankAccount,
        isNonVatPayer: validSupplierData.isNonVatPayer,
      });
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });
  });

  describe('PUT /api/v1/supplier', () => {
    it('should create new supplier info', async () => {
      const response = await request(app)
        .put('/api/v1/supplier')
        .set('Cookie', [`token=${authToken}`])
        .send(validSupplierData);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        userId: testUser.id,
        name: validSupplierData.name,
        street: validSupplierData.street,
        city: validSupplierData.city,
        zipCode: validSupplierData.zipCode,
        country: validSupplierData.country,
        ico: validSupplierData.ico,
        dic: validSupplierData.dic,
        bankAccount: validSupplierData.bankAccount,
        isNonVatPayer: validSupplierData.isNonVatPayer,
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        name: '', // Empty name should fail validation
        street: 'Valid Street',
        city: 'Valid City',
        zipCode: '12345',
        country: 'Czech Republic',
      };

      const response = await request(app)
        .put('/api/v1/supplier')
        .set('Cookie', [`token=${authToken}`])
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should update existing supplier info', async () => {
      // First create supplier
      await request(app)
        .put('/api/v1/supplier')
        .set('Cookie', [`token=${authToken}`])
        .send(validSupplierData);

      // Then update it
      const updatedData = {
        name: 'Updated Company Ltd.',
        street: 'Updated Street 456',
        city: 'Updated City',
        zipCode: '54321',
        country: 'Czech Republic',
        ico: '87654321',
        dic: 'CZ87654321',
      };

      const response = await request(app)
        .put('/api/v1/supplier')
        .set('Cookie', [`token=${authToken}`])
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        userId: testUser.id,
        name: updatedData.name,
        street: updatedData.street,
        city: updatedData.city,
        zipCode: updatedData.zipCode,
        ico: updatedData.ico,
        dic: updatedData.dic,
      });

      // Verify in database
      const supplier = await prisma.supplier.findUnique({
        where: { userId: testUser.id },
      });
      expect(supplier?.name).toBe(updatedData.name);
      expect(supplier?.street).toBe(updatedData.street);
      expect(supplier?.city).toBe(updatedData.city);
    });
  });
});