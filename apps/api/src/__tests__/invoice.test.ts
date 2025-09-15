import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index';
import { prisma } from '../utils/prisma';

describe('Invoice API', () => {
  let authToken: string;
  let supplierId: string;
  let testInvoiceId: string;

  beforeAll(async () => {
    // Clean up test data
    await prisma.invoiceItem.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'invoice-test@example.com',
        passwordHash: 'hashedpassword',
      },
    });

    // Create test supplier
    const supplier = await prisma.supplier.create({
      data: {
        userId: user.id,
        name: 'Test Supplier Inc.',
        street: '123 Business St',
        city: 'Test City',
        zipCode: 'TC 12345',
        country: 'Czech Republic',
        ico: '12345678',
        dic: 'CZ12345678',
        isNonVatPayer: false,
      },
    });
    supplierId = supplier.id;

    // Create JWT token for authentication
    authToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!);
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.invoiceItem.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /api/v1/invoices', () => {
    const validInvoiceData = {
      clientName: 'Test Client Corp',
      clientStreet: '456 Client Ave',
      clientCity: 'Client City',
      clientZipCode: 'CC 67890',
      clientCountry: 'Czech Republic',
      issueDate: '2025-08-29',
      dueDate: '2025-09-29',
      items: [
        {
          description: 'Consulting Services',
          quantity: 10,
          unitPrice: 100,
        },
        {
          description: 'Development Work',
          quantity: 5,
          unitPrice: 150,
        },
      ],
    };

    it('should create a new invoice with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/invoices')
        .set('Cookie', [`token=${authToken}`])
        .send(validInvoiceData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('invoiceNumber');
      
      // Check YYMMDDXXXX format (10 digits total)
      const invoiceNumber = response.body.invoiceNumber;
      expect(invoiceNumber.toString().length).toBe(10);
      
      // Check date prefix matches today (YYMMDD)
      const today = new Date();
      const expectedPrefix = today.getFullYear().toString().slice(-2) +
                           (today.getMonth() + 1).toString().padStart(2, '0') +
                           today.getDate().toString().padStart(2, '0');
      expect(invoiceNumber.toString().startsWith(expectedPrefix)).toBe(true);
      
      // Check sequence part (last 4 digits should be 0001 for first invoice)
      expect(invoiceNumber.toString().endsWith('0001')).toBe(true);
      
      expect(response.body.clientName).toBe(validInvoiceData.clientName);
      expect(response.body.clientStreet).toBe(validInvoiceData.clientStreet);
      expect(response.body.clientCity).toBe(validInvoiceData.clientCity);
      expect(response.body.clientZipCode).toBe(validInvoiceData.clientZipCode);
      expect(response.body.clientCountry).toBe(validInvoiceData.clientCountry);
      expect(Number(response.body.subtotal)).toBe(1750); // 10*100 + 5*150
      expect(Number(response.body.total)).toBe(1750);
      expect(response.body.items).toHaveLength(2);
      expect(response.body.supplier.id).toBe(supplierId);

      testInvoiceId = response.body.id;
    });

    it('should generate sequential invoice numbers with date format', async () => {
      const response = await request(app)
        .post('/api/v1/invoices')
        .set('Cookie', [`token=${authToken}`])
        .send(validInvoiceData)
        .expect(201);

      const invoiceNumber = response.body.invoiceNumber;
      
      // Should end with 0002 for second invoice of the day  
      expect(invoiceNumber.toString().endsWith('0002')).toBe(true);
      
      // Should still be 10 digits
      expect(invoiceNumber.toString().length).toBe(10);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .post('/api/v1/invoices')
        .send(validInvoiceData)
        .expect(401);
    });

    it('should return 400 with invalid data', async () => {
      const invalidData = {
        clientName: '', // Empty required field
        clientStreet: validInvoiceData.clientStreet,
        clientCity: validInvoiceData.clientCity,
        clientZipCode: validInvoiceData.clientZipCode,
        clientCountry: validInvoiceData.clientCountry,
        issueDate: validInvoiceData.issueDate,
        dueDate: validInvoiceData.dueDate,
        items: validInvoiceData.items,
      };

      const response = await request(app)
        .post('/api/v1/invoices')
        .set('Cookie', [`token=${authToken}`])
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body).toHaveProperty('details');
    });

    it('should return 400 with empty items array', async () => {
      const invalidData = {
        ...validInvoiceData,
        items: [],
      };

      const response = await request(app)
        .post('/api/v1/invoices')
        .set('Cookie', [`token=${authToken}`])
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    it('should return 400 without supplier profile', async () => {
      // Create user without supplier profile
      const userWithoutSupplier = await prisma.user.create({
        data: {
          email: 'no-supplier@example.com',
          passwordHash: 'hashedpassword',
        },
      });

      const tokenWithoutSupplier = jwt.sign(
        { userId: userWithoutSupplier.id },
        process.env.JWT_SECRET!
      );

      const response = await request(app)
        .post('/api/v1/invoices')
        .set('Cookie', [`token=${tokenWithoutSupplier}`])
        .send(validInvoiceData)
        .expect(400);

      expect(response.body.error).toContain('Supplier profile not found');

      // Clean up
      await prisma.user.delete({ where: { id: userWithoutSupplier.id } });
    });
  });

  describe('GET /api/v1/invoices/:id', () => {
    it('should retrieve an existing invoice', async () => {
      const response = await request(app)
        .get(`/api/v1/invoices/${testInvoiceId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.body.id).toBe(testInvoiceId);
      expect(response.body.invoiceNumber.toString().endsWith('0001')).toBe(true);
      expect(response.body.clientName).toBe('Test Client Corp');
      expect(response.body.items).toHaveLength(2);
      expect(response.body.supplier).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get(`/api/v1/invoices/${testInvoiceId}`)
        .expect(401);
    });

    it('should return 404 for non-existent invoice', async () => {
      const nonExistentId = '00000000-0000-4000-8000-000000000000';
      
      const response = await request(app)
        .get(`/api/v1/invoices/${nonExistentId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(404);

      expect(response.body.error).toContain('Invoice not found');
    });

    it('should return 404 when accessing another supplier\'s invoice', async () => {
      // Create another user and supplier
      const otherUser = await prisma.user.create({
        data: {
          email: 'other-supplier@example.com',
          passwordHash: 'hashedpassword',
        },
      });

      const otherSupplier = await prisma.supplier.create({
        data: {
          userId: otherUser.id,
          name: 'Other Supplier',
          street: '789 Other St',
          city: 'Other City',
          zipCode: '12345',
          country: 'Czech Republic',
        },
      });

      const otherToken = jwt.sign({ userId: otherUser.id }, process.env.JWT_SECRET!);

      const response = await request(app)
        .get(`/api/v1/invoices/${testInvoiceId}`)
        .set('Cookie', [`token=${otherToken}`])
        .expect(404);

      expect(response.body.error).toContain('Invoice not found or access denied');

      // Clean up
      await prisma.supplier.delete({ where: { id: otherSupplier.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('GET /api/v1/invoices', () => {
    it('should list all invoices for current supplier', async () => {
      const response = await request(app)
        .get('/api/v1/invoices')
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2); // We created 2 invoices
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('invoiceNumber');
      expect(response.body[0]).toHaveProperty('supplier');
      expect(response.body[0]).toHaveProperty('items');
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/v1/invoices')
        .expect(401);
    });

    it('should return empty array for supplier with no invoices', async () => {
      // Create new user/supplier with no invoices
      const newUser = await prisma.user.create({
        data: {
          email: 'empty-supplier@example.com',
          passwordHash: 'hashedpassword',
        },
      });

      const newSupplier = await prisma.supplier.create({
        data: {
          userId: newUser.id,
          name: 'Empty Supplier',
          street: '999 Empty St',
          city: 'Empty City',
          zipCode: '99999',
          country: 'Czech Republic',
        },
      });

      const emptyToken = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET!);

      const response = await request(app)
        .get('/api/v1/invoices')
        .set('Cookie', [`token=${emptyToken}`])
        .expect(200);

      expect(response.body).toEqual([]);

      // Clean up
      await prisma.supplier.delete({ where: { id: newSupplier.id } });
      await prisma.user.delete({ where: { id: newUser.id } });
    });
  });

  describe('Invoice Number Generation', () => {
    it('should generate invoice numbers in YYMMDDXXXX format', async () => {
      const testData = {
        clientName: 'Format Test Client',
        clientAddress: '123 Format Ave\nFormat City, FC 12345',
        issueDate: '2025-08-29',
        dueDate: '2025-09-29',
        items: [{
          description: 'Test Service',
          quantity: 1,
          unitPrice: 100,
        }],
      };
      
      const response = await request(app)
        .post('/api/v1/invoices')
        .set('Cookie', [`token=${authToken}`])
        .send(testData)
        .expect(201);

      const invoiceNumber = response.body.invoiceNumber;
      const invoiceStr = invoiceNumber.toString();
      
      // Should be exactly 10 digits
      expect(invoiceStr.length).toBe(10);
      
      // First 6 digits should be current date (YYMMDD)
      const today = new Date();
      const expectedYear = today.getFullYear().toString().slice(-2);
      const expectedMonth = (today.getMonth() + 1).toString().padStart(2, '0');
      const expectedDay = today.getDate().toString().padStart(2, '0');
      const expectedDatePrefix = expectedYear + expectedMonth + expectedDay;
      
      expect(invoiceStr.substring(0, 6)).toBe(expectedDatePrefix);
      
      // Last 4 digits should be sequence number (padded with zeros)
      const sequencePart = invoiceStr.substring(6);
      expect(sequencePart.length).toBe(4);
      expect(/^\d{4}$/.test(sequencePart)).toBe(true);
      
      // Should be able to parse back to integer (invoiceNumber is now a string)
      expect(Number.isInteger(parseInt(invoiceNumber))).toBe(true);
    });

    it('should reset sequence daily and increment within the day', async () => {
      // This test assumes we're creating multiple invoices on the same day
      // The sequence should increment: 00001, 00002, 00003, etc.
      
      const baseTestData = {
        clientAddress: '123 Sequence Ave\nSequence City, SC 12345',
        issueDate: '2025-08-29',
        dueDate: '2025-09-29',
        items: [{
          description: 'Sequence Test Service',
          quantity: 1,
          unitPrice: 100,
        }],
      };
      
      const responses = [];
      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .post('/api/v1/invoices')
          .set('Cookie', [`token=${authToken}`])
          .send({
            ...baseTestData,
            clientName: `Sequence Test Client ${i + 1}`,
          })
          .expect(201);
        responses.push(response);
      }
      
      const invoiceNumbers = responses.map(r => r.body.invoiceNumber.toString());
      
      // All should have same date prefix
      const datePrefix = invoiceNumbers[0].substring(0, 6);
      invoiceNumbers.forEach(num => {
        expect(num.substring(0, 6)).toBe(datePrefix);
      });
      
      // Sequences should be incremental
      const sequences = invoiceNumbers.map(num => parseInt(num.substring(6)));
      expect(sequences[1]).toBe(sequences[0] + 1);
      expect(sequences[2]).toBe(sequences[1] + 1);
    });

    it('should handle concurrent invoice creation without duplicate numbers', async () => {
      // Create multiple invoices concurrently to test transaction safety
      const promises = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/api/v1/invoices')
          .set('Cookie', [`token=${authToken}`])
          .send({
            clientName: `Concurrent Client ${i}`,
            clientAddress: `${i} Concurrent St`,
            issueDate: '2025-08-29',
            dueDate: '2025-09-29',
            items: [
              {
                description: `Service ${i}`,
                quantity: 1,
                unitPrice: 100,
              },
            ],
          })
      );

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Invoice numbers should be sequential and unique (daily sequences)
      const invoiceNumbers = responses.map(response => response.body.invoiceNumber);
      const uniqueNumbers = [...new Set(invoiceNumbers)];
      
      expect(uniqueNumbers.length).toBe(invoiceNumbers.length);
      
      // Check that all have the same date prefix but different sequences
      const today = new Date();
      const expectedPrefix = today.getFullYear().toString().slice(-2) +
                           (today.getMonth() + 1).toString().padStart(2, '0') +
                           today.getDate().toString().padStart(2, '0');
      
      invoiceNumbers.forEach(num => {
        expect(num.toString().startsWith(expectedPrefix)).toBe(true);
        expect(num.toString().length).toBe(10);
      });
      
      // Extract sequences (last 4 digits) and verify they're unique and sequential
      const sequences = invoiceNumbers.map(num => parseInt(num.toString().slice(-4)));
      sequences.sort();
      
      // Check that sequences are consecutive (don't know the exact starting point due to previous tests)
      for (let i = 1; i < sequences.length; i++) {
        expect(sequences[i]).toBe(sequences[i-1] + 1);
      }
    });
  });

  describe('VAT Calculations', () => {
    const vatInvoiceData = {
      clientName: 'VAT Test Client',
      clientAddress: '789 VAT St\nVAT City, VC 12345',
      issueDate: '2025-08-30',
      dueDate: '2025-09-30',
      items: [
        {
          description: 'Service with 21% VAT',
          quantity: 1,
          unitPrice: 1000,
          vatRate: 21,
        },
        {
          description: 'Service with 15% VAT',
          quantity: 2,
          unitPrice: 500,
          vatRate: 15,
        },
        {
          description: 'Service with 0% VAT',
          quantity: 1,
          unitPrice: 300,
          vatRate: 0,
        },
      ],
    };

    it('should correctly calculate VAT amounts for mixed rates', async () => {
      const response = await request(app)
        .post('/api/v1/invoices')
        .set('Cookie', [`token=${authToken}`])
        .send(vatInvoiceData)
        .expect(201);

      // Subtotal: 1000 + (2*500) + 300 = 2300
      expect(Number(response.body.subtotal)).toBe(2300);
      
      // VAT: (1000*0.21) + (1000*0.15) + (300*0.0) = 210 + 150 + 0 = 360
      expect(Number(response.body.vatAmount)).toBe(360);
      
      // Total: 2300 + 360 = 2660
      expect(Number(response.body.total)).toBe(2660);

      // Check individual items have correct VAT rates (Decimal values returned as strings)
      expect(Number(response.body.items[0].vatRate)).toBe(21);
      expect(Number(response.body.items[1].vatRate)).toBe(15);
      expect(Number(response.body.items[2].vatRate)).toBe(0);
    });

    it('should handle invoice with all 21% VAT', async () => {
      const highVatData = {
        clientName: 'High VAT Client',
        clientAddress: '456 High VAT Ave',
        issueDate: '2025-08-30',
        dueDate: '2025-09-30',
        items: [
          {
            description: 'High VAT Service',
            quantity: 10,
            unitPrice: 100,
            vatRate: 21,
          },
        ],
      };

      const response = await request(app)
        .post('/api/v1/invoices')
        .set('Cookie', [`token=${authToken}`])
        .send(highVatData)
        .expect(201);

      // Subtotal: 10 * 100 = 1000
      expect(Number(response.body.subtotal)).toBe(1000);
      
      // VAT: 1000 * 0.21 = 210
      expect(Number(response.body.vatAmount)).toBe(210);
      
      // Total: 1000 + 210 = 1210
      expect(Number(response.body.total)).toBe(1210);
    });

    it('should handle invoice with all 0% VAT', async () => {
      const zeroVatData = {
        clientName: 'Zero VAT Client',
        clientAddress: '123 Zero VAT Blvd',
        issueDate: '2025-08-30',
        dueDate: '2025-09-30',
        items: [
          {
            description: 'Zero VAT Service',
            quantity: 5,
            unitPrice: 200,
            vatRate: 0,
          },
        ],
      };

      const response = await request(app)
        .post('/api/v1/invoices')
        .set('Cookie', [`token=${authToken}`])
        .send(zeroVatData)
        .expect(201);

      // Subtotal: 5 * 200 = 1000
      expect(Number(response.body.subtotal)).toBe(1000);
      
      // VAT: 1000 * 0.0 = 0
      expect(Number(response.body.vatAmount)).toBe(0);
      
      // Total: 1000 + 0 = 1000
      expect(Number(response.body.total)).toBe(1000);
    });

    it('should handle items without VAT rate (defaults to 0%)', async () => {
      const noVatRateData = {
        clientName: 'No VAT Rate Client',
        clientAddress: '321 No Rate St',
        issueDate: '2025-08-30',
        dueDate: '2025-09-30',
        items: [
          {
            description: 'Service without VAT rate specified',
            quantity: 3,
            unitPrice: 400,
            // vatRate not specified, should default to 0
          },
        ],
      };

      const response = await request(app)
        .post('/api/v1/invoices')
        .set('Cookie', [`token=${authToken}`])
        .send(noVatRateData)
        .expect(201);

      // Subtotal: 3 * 400 = 1200
      expect(Number(response.body.subtotal)).toBe(1200);
      
      // VAT: 1200 * 0.0 = 0 (defaults to 0%)
      expect(Number(response.body.vatAmount)).toBe(0);
      
      // Total: 1200 + 0 = 1200
      expect(Number(response.body.total)).toBe(1200);

      // VAT rate should be stored as 0 when not specified (null maps to 0)
      const vatRate = response.body.items[0].vatRate;
      expect(vatRate === null || Number(vatRate) === 0).toBe(true);
    });

    it('should reject invalid VAT rates', async () => {
      const invalidVatData = {
        clientName: 'Invalid VAT Client',
        clientAddress: '999 Invalid St',
        issueDate: '2025-08-30',
        dueDate: '2025-09-30',
        items: [
          {
            description: 'Service with invalid VAT',
            quantity: 1,
            unitPrice: 100,
            vatRate: 150, // Invalid: > 100%
          },
        ],
      };

      const response = await request(app)
        .post('/api/v1/invoices')
        .set('Cookie', [`token=${authToken}`])
        .send(invalidVatData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body.details[0].message).toContain('100');
    });

    it('should reject negative VAT rates', async () => {
      const negativeVatData = {
        clientName: 'Negative VAT Client',
        clientAddress: '888 Negative Ave',
        issueDate: '2025-08-30',
        dueDate: '2025-09-30',
        items: [
          {
            description: 'Service with negative VAT',
            quantity: 1,
            unitPrice: 100,
            vatRate: -5, // Invalid: negative
          },
        ],
      };

      const response = await request(app)
        .post('/api/v1/invoices')
        .set('Cookie', [`token=${authToken}`])
        .send(negativeVatData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body.details[0].message).toContain('0');
    });

    it('should handle decimal VAT calculations correctly', async () => {
      const decimalVatData = {
        clientName: 'Decimal VAT Client',
        clientAddress: '777 Decimal Dr',
        issueDate: '2025-08-30',
        dueDate: '2025-09-30',
        items: [
          {
            description: 'Service with decimal calculations',
            quantity: 3,
            unitPrice: 33.33,
            vatRate: 21,
          },
        ],
      };

      const response = await request(app)
        .post('/api/v1/invoices')
        .set('Cookie', [`token=${authToken}`])
        .send(decimalVatData)
        .expect(201);

      const expectedSubtotal = 3 * 33.33; // 99.99
      const expectedVat = expectedSubtotal * 0.21; // 20.9979 -> 21.00 (rounded)
      const expectedTotal = expectedSubtotal + expectedVat; // 120.99

      expect(Number(response.body.subtotal)).toBeCloseTo(expectedSubtotal, 2);
      expect(Number(response.body.vatAmount)).toBeCloseTo(expectedVat, 2);
      expect(Number(response.body.total)).toBeCloseTo(expectedTotal, 2);
    });

    it('should handle Czech standard VAT rates (12%, 15%, 21%)', async () => {
      const czechVatData = {
        clientName: 'Czech VAT Client',
        clientAddress: 'Praha 1, Czech Republic',
        issueDate: '2025-08-30',
        dueDate: '2025-09-30',
        items: [
          {
            description: 'Basic VAT rate service',
            quantity: 1,
            unitPrice: 1000,
            vatRate: 21, // Standard rate
          },
          {
            description: 'Reduced VAT rate service',
            quantity: 1,
            unitPrice: 1000,
            vatRate: 15, // Reduced rate
          },
          {
            description: 'Special VAT rate service',
            quantity: 1,
            unitPrice: 1000,
            vatRate: 12, // Special rate
          },
        ],
      };

      const response = await request(app)
        .post('/api/v1/invoices')
        .set('Cookie', [`token=${authToken}`])
        .send(czechVatData)
        .expect(201);

      // Subtotal: 3 * 1000 = 3000
      expect(Number(response.body.subtotal)).toBe(3000);
      
      // VAT: (1000*0.21) + (1000*0.15) + (1000*0.12) = 210 + 150 + 120 = 480
      expect(Number(response.body.vatAmount)).toBe(480);
      
      // Total: 3000 + 480 = 3480
      expect(Number(response.body.total)).toBe(3480);
    });
  });

  describe('Non-VAT Payer Invoices', () => {
    let nonVatAuthToken: string;

    beforeAll(async () => {
      // Create non-VAT payer user and supplier
      const nonVatUser = await prisma.user.create({
        data: {
          email: 'non-vat@example.com',
          passwordHash: 'hashedpassword',
        },
      });

      await prisma.supplier.create({
        data: {
          userId: nonVatUser.id,
          name: 'Non-VAT Payer Company',
          street: 'Non-VAT Street 123',
          city: 'Non-VAT City',
          zipCode: 'NVC 12345',
          country: 'Czech Republic',
          ico: '87654321',
          isNonVatPayer: true, // No DIČ for non-VAT payers
        },
      });
      nonVatAuthToken = jwt.sign({ userId: nonVatUser.id }, process.env.JWT_SECRET!);
    });

    it('should create invoices for non-VAT payers with no VAT amounts', async () => {
      const nonVatInvoiceData = {
        clientName: 'Client for Non-VAT Company',
        clientAddress: 'Client Street 456',
        issueDate: '2025-08-30',
        dueDate: '2025-09-30',
        items: [
          {
            description: 'Service from non-VAT payer',
            quantity: 2,
            unitPrice: 500,
            vatRate: 0, // Non-VAT payers should use 0%
          },
        ],
      };

      const response = await request(app)
        .post('/api/v1/invoices')
        .set('Cookie', [`token=${nonVatAuthToken}`])
        .send(nonVatInvoiceData)
        .expect(201);

      expect(Number(response.body.subtotal)).toBe(1000);
      expect(Number(response.body.vatAmount)).toBe(0);
      expect(Number(response.body.total)).toBe(1000);
      expect(response.body.supplier.isNonVatPayer).toBe(true);
      expect(response.body.supplier.dic).toBeNull();
    });
  });

  describe('Reverse Charge Functionality', () => {
    it('should create invoice with reverse charge enabled', async () => {
      const reverseChargeData = {
        clientName: 'Construction Client Ltd.',
        clientAddress: 'Building Site 123\nPrague, Czech Republic',
        issueDate: '2025-08-31',
        dueDate: '2025-09-14',
        isReverseCharge: true,
        items: [
          {
            description: 'Construction services',
            quantity: 10,
            unitPrice: 500,
            vatRate: 21, // Should be ignored for reverse charge
          },
          {
            description: 'Material supply',
            quantity: 5,
            unitPrice: 200,
            vatRate: 21, // Should be ignored for reverse charge
          }
        ]
      };

      const response = await request(app)
        .post('/api/v1/invoices')
        .set('Cookie', [`token=${authToken}`])
        .send(reverseChargeData)
        .expect(201);

      expect(response.body).toMatchObject({
        clientName: 'Construction Client Ltd.',
        isReverseCharge: true,
        subtotal: '6000', // (10 * 500) + (5 * 200)
        vatAmount: '0', // Should be 0 for reverse charge
        total: '6000' // Should equal subtotal for reverse charge
      });

      // Verify items have vatRate set to null for reverse charge
      expect(response.body.items).toHaveLength(2);
      response.body.items.forEach((item: any) => {
        expect(item.vatRate).toBeNull();
      });
    });

    it('should create standard invoice when reverse charge is disabled', async () => {
      const standardData = {
        clientName: 'Standard Client Corp.',
        clientAddress: 'Office Building 456\nBrno, Czech Republic',
        issueDate: '2025-08-31',
        dueDate: '2025-09-14',
        isReverseCharge: false,
        items: [
          {
            description: 'Standard consulting',
            quantity: 10,
            unitPrice: 500,
            vatRate: 21,
          }
        ]
      };

      const response = await request(app)
        .post('/api/v1/invoices')
        .set('Cookie', [`token=${authToken}`])
        .send(standardData)
        .expect(201);

      expect(response.body).toMatchObject({
        clientName: 'Standard Client Corp.',
        isReverseCharge: false,
        subtotal: '5000', // 10 * 500
        vatAmount: '1050', // 5000 * 0.21
        total: '6050' // 5000 + 1050
      });

      // Verify items retain their VAT rates
      expect(response.body.items[0].vatRate).toBe('21');
    });

    it('should default isReverseCharge to false when not specified', async () => {
      const defaultData = {
        clientName: 'Default Client Inc.',
        clientAddress: 'Default Address 789\nOstrava, Czech Republic',
        issueDate: '2025-08-31',
        dueDate: '2025-09-14',
        items: [
          {
            description: 'Standard service',
            quantity: 1,
            unitPrice: 1000,
            vatRate: 21,
          }
        ]
      };

      const response = await request(app)
        .post('/api/v1/invoices')
        .set('Cookie', [`token=${authToken}`])
        .send(defaultData)
        .expect(201);

      expect(response.body.isReverseCharge).toBe(false);
      expect(response.body.vatAmount).toBe('210'); // Should calculate VAT normally
    });

    it('should return reverse charge flag when fetching invoice', async () => {
      // Create reverse charge invoice
      const createResponse = await request(app)
        .post('/api/v1/invoices')
        .set('Cookie', [`token=${authToken}`])
        .send({
          clientName: 'Fetch Test Client',
          clientAddress: 'Fetch Address',
          issueDate: '2025-08-31',
          dueDate: '2025-09-14',
          isReverseCharge: true,
          items: [{ description: 'Test service', quantity: 1, unitPrice: 1000, vatRate: 21 }]
        })
        .expect(201);

      const invoiceId = createResponse.body.id;

      // Fetch the invoice
      const getResponse = await request(app)
        .get(`/api/v1/invoices/${invoiceId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(getResponse.body.isReverseCharge).toBe(true);
      expect(getResponse.body.vatAmount).toBe('0');
    });

    it('should generate PDF with reverse charge information', async () => {
      // Create reverse charge invoice
      const createResponse = await request(app)
        .post('/api/v1/invoices')
        .set('Cookie', [`token=${authToken}`])
        .send({
          clientName: 'PDF Test Client',
          clientAddress: 'PDF Address',
          issueDate: '2025-08-31',
          dueDate: '2025-09-14',
          isReverseCharge: true,
          items: [{ description: 'Construction work', quantity: 1, unitPrice: 1000, vatRate: 21 }]
        })
        .expect(201);

      const invoiceId = createResponse.body.id;

      // Generate PDF
      const pdfResponse = await request(app)
        .get(`/api/v1/invoices/${invoiceId}/pdf`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(pdfResponse.headers['content-type']).toBe('application/pdf');
      expect(pdfResponse.headers['content-disposition']).toMatch(/attachment; filename=.*\.pdf/);
    });

    it('should persist isReverseCharge field in database', async () => {
      // Create invoice via API
      const response = await request(app)
        .post('/api/v1/invoices')
        .set('Cookie', [`token=${authToken}`])
        .send({
          clientName: 'Database Test Client',
          clientAddress: 'Database Address',
          issueDate: '2025-08-31',
          dueDate: '2025-09-14',
          isReverseCharge: true,
          items: [{ description: 'Test service', quantity: 1, unitPrice: 1000, vatRate: 21 }]
        })
        .expect(201);

      // Query database directly
      const dbInvoice = await prisma.invoice.findUnique({
        where: { id: response.body.id },
        include: { items: true }
      });

      expect(dbInvoice).not.toBeNull();
      expect(dbInvoice!.isReverseCharge).toBe(true);
      expect(dbInvoice!.vatAmount.toNumber()).toBe(0);
      
      // Verify item VAT rates are set to null
      dbInvoice!.items.forEach((item: any) => {
        expect(item.vatRate).toBeNull();
      });
    });

    it('should accept boolean values for isReverseCharge', async () => {
      const testCases = [true, false];

      for (const isReverseCharge of testCases) {
        const response = await request(app)
          .post('/api/v1/invoices')
          .set('Cookie', [`token=${authToken}`])
          .send({
            clientName: `Boolean Test Client ${isReverseCharge}`,
            clientAddress: 'Boolean Test Address',
            issueDate: '2025-08-31',
            dueDate: '2025-09-14',
            isReverseCharge,
            items: [{ description: 'Test', quantity: 1, unitPrice: 1000, vatRate: 21 }]
          })
          .expect(201);

        expect(response.body.isReverseCharge).toBe(isReverseCharge);
      }
    });
  });
});