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

    it('should return 404 when no supplier info exists', async () => {
      const response = await request(app)
        .get('/api/v1/supplier')
        .set('Cookie', [`token=${authToken}`]);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Supplier information not found');
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
    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .put('/api/v1/supplier')
        .send(validSupplierData);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized - No token provided');
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
      expect(response.body.details).toBeDefined();
    });

    it('should create new supplier info when none exists', async () => {
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
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();

      // Verify in database
      const supplier = await prisma.supplier.findUnique({
        where: { userId: testUser.id },
      });
      expect(supplier).toBeTruthy();
      expect(supplier?.name).toBe(validSupplierData.name);
    });

    it('should update existing supplier info', async () => {
      // Create initial supplier data
      const initialSupplier = await prisma.supplier.create({
        data: {
          ...validSupplierData,
          userId: testUser.id,
        },
      });

      const updatedData = {
        name: 'Updated Company Name',
        address: 'Updated Address',
        ico: '87654321',
        dic: 'CZ87654321',
      };

      const response = await request(app)
        .put('/api/v1/supplier')
        .set('Cookie', [`token=${authToken}`])
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: initialSupplier.id,
        userId: testUser.id,
        name: updatedData.name,
        address: updatedData.address,
        ico: updatedData.ico,
        dic: updatedData.dic,
      });

      // Verify in database
      const supplier = await prisma.supplier.findUnique({
        where: { userId: testUser.id },
      });
      expect(supplier?.name).toBe(updatedData.name);
      expect(supplier?.address).toBe(updatedData.address);
    });

    it('should handle optional fields correctly', async () => {
      const dataWithoutOptionalFields = {
        name: 'Test Company',
        address: 'Test Address',
        // ico and dic are optional
      };

      const response = await request(app)
        .put('/api/v1/supplier')
        .set('Cookie', [`token=${authToken}`])
        .send(dataWithoutOptionalFields);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        userId: testUser.id,
        name: dataWithoutOptionalFields.name,
        address: dataWithoutOptionalFields.address,
        ico: null,
        dic: null,
        bankAccount: null,
      });
    });

    it('should convert empty strings to null for optional fields', async () => {
      const dataWithEmptyStrings = {
        name: 'Test Company',
        address: 'Test Address',
        ico: '',
        dic: '',
        bankAccount: '',
      };

      const response = await request(app)
        .put('/api/v1/supplier')
        .set('Cookie', [`token=${authToken}`])
        .send(dataWithEmptyStrings);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        userId: testUser.id,
        name: dataWithEmptyStrings.name,
        address: dataWithEmptyStrings.address,
        ico: null,
        dic: null,
        bankAccount: null,
      });
    });
    it('should handle bank account field correctly', async () => {
      const dataWithBankAccount = {
        name: 'Test Company',
        address: 'Test Address',
        ico: '12345678',
        dic: 'CZ12345678',
        bankAccount: 'CZ6508000000192000145399',
      };

      const response = await request(app)
        .put('/api/v1/supplier')
        .set('Cookie', [`token=${authToken}`])
        .send(dataWithBankAccount);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        userId: testUser.id,
        name: dataWithBankAccount.name,
        address: dataWithBankAccount.address,
        ico: dataWithBankAccount.ico,
        dic: dataWithBankAccount.dic,
        bankAccount: dataWithBankAccount.bankAccount,
      });

      // Verify in database
      const supplier = await prisma.supplier.findUnique({
        where: { userId: testUser.id },
      });
      expect(supplier?.bankAccount).toBe(dataWithBankAccount.bankAccount);
    });

    it('should handle bank account update correctly', async () => {
      // Create initial supplier
      const initialData = {
        name: 'Bank Test Company',
        address: 'Bank Test Address',
        bankAccount: 'CZ1234567890123456789012',
      };

      await request(app)
        .put('/api/v1/supplier')
        .set('Cookie', [`token=${authToken}`])
        .send(initialData);

      // Update bank account
      const updatedData = {
        ...initialData,
        bankAccount: 'CZ9876543210987654321098',
      };

      const response = await request(app)
        .put('/api/v1/supplier')
        .set('Cookie', [`token=${authToken}`])
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.bankAccount).toBe(updatedData.bankAccount);

      // Verify in database
      const supplier = await prisma.supplier.findUnique({
        where: { userId: testUser.id },
      });
      expect(supplier?.bankAccount).toBe(updatedData.bankAccount);
    });
  });

  describe('VAT Payer Status', () => {
    it('should handle VAT payer status correctly', async () => {
      const vatPayerData = {
        name: 'VAT Payer Company',
        address: 'VAT Street 123',
        ico: '12345678',
        dic: 'CZ12345678',
        isNonVatPayer: false,
      };

      const response = await request(app)
        .put('/api/v1/supplier')
        .set('Cookie', [`token=${authToken}`])
        .send(vatPayerData);

      expect(response.status).toBe(200);
      expect(response.body.isNonVatPayer).toBe(false);
      expect(response.body.dic).toBe('CZ12345678');
    });

    it('should handle non-VAT payer status correctly', async () => {
      const nonVatPayerData = {
        name: 'Non-VAT Payer Company',
        address: 'Non-VAT Street 456',
        ico: '87654321',
        dic: '', // Should be empty for non-VAT payers
        isNonVatPayer: true,
      };

      const response = await request(app)
        .put('/api/v1/supplier')
        .set('Cookie', [`token=${authToken}`])
        .send(nonVatPayerData);

      expect(response.status).toBe(200);
      expect(response.body.isNonVatPayer).toBe(true);
      expect(response.body.dic).toBeNull();
    });

    it('should default to VAT payer when isNonVatPayer is not provided', async () => {
      const defaultData = {
        name: 'Default Company',
        address: 'Default Street 789',
        ico: '11223344',
        dic: 'CZ11223344',
      };

      const response = await request(app)
        .put('/api/v1/supplier')
        .set('Cookie', [`token=${authToken}`])
        .send(defaultData);

      expect(response.status).toBe(200);
      expect(response.body.isNonVatPayer).toBe(false);
      expect(response.body.dic).toBe('CZ11223344');
    });

    it('should update VAT status from payer to non-payer', async () => {
      // Create initial VAT payer
      const initialData = {
        name: 'Converting Company',
        address: 'Converting Street 111',
        ico: '99887766',
        dic: 'CZ99887766',
        isNonVatPayer: false,
      };

      await request(app)
        .put('/api/v1/supplier')
        .set('Cookie', [`token=${authToken}`])
        .send(initialData);

      // Update to non-VAT payer
      const updatedData = {
        ...initialData,
        isNonVatPayer: true,
        dic: '', // Clear DIČ
      };

      const response = await request(app)
        .put('/api/v1/supplier')
        .set('Cookie', [`token=${authToken}`])
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.isNonVatPayer).toBe(true);
      expect(response.body.dic).toBeNull();
    });

    it('should update VAT status from non-payer to payer', async () => {
      // Create initial non-VAT payer
      const initialData = {
        name: 'Converting Back Company',
        address: 'Converting Back Street 222',
        ico: '55443322',
        isNonVatPayer: true,
      };

      await request(app)
        .put('/api/v1/supplier')
        .set('Cookie', [`token=${authToken}`])
        .send(initialData);

      // Update to VAT payer
      const updatedData = {
        ...initialData,
        dic: 'CZ55443322',
        isNonVatPayer: false,
      };

      const response = await request(app)
        .put('/api/v1/supplier')
        .set('Cookie', [`token=${authToken}`])
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.isNonVatPayer).toBe(false);
      expect(response.body.dic).toBe('CZ55443322');
    });
  });
});