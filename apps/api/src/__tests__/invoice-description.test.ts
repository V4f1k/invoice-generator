import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index';
import { prisma } from '../utils/prisma';

describe('Invoice Description Feature - Story 1.17', () => {
  let authToken: string;

  beforeAll(async () => {
    // Clean up test data
    await prisma.invoiceItem.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'description-test@example.com',
        passwordHash: 'hashedpassword',
      },
    });

    // Create test supplier
    await prisma.supplier.create({
      data: {
        userId: user.id,
        name: 'Description Test Supplier',
        street: '123 Test Street',
        city: 'Test City',
        zipCode: '12345',
        country: 'Czech Republic',
        ico: '12345678',
        dic: 'CZ12345678',
        isNonVatPayer: false,
      },
    });

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

  describe('Description Field Tests', () => {
    it('should create invoice with description field', async () => {
      const invoiceData = {
        clientName: 'Test Client with Description',
        clientStreet: '456 Client Street',
        clientCity: 'Client City',
        clientZipCode: '67890',
        clientCountry: 'Czech Republic',
        issueDate: '2025-08-31',
        dueDate: '2025-09-14',
        description: 'This is a test description for the invoice.\nIt includes multiple lines\nto test line breaks.',
        items: [
          {
            description: 'Test Service',
            quantity: 1,
            unitPrice: 1000,
            vatRate: 21,
          },
        ],
      };

      const response = await request(app)
        .post('/api/v1/invoices')
        .set('Cookie', [`token=${authToken}`])
        .send(invoiceData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.description).toBe(invoiceData.description);

      // Verify in database
      const invoice = await prisma.invoice.findUnique({
        where: { id: response.body.id },
      });

      expect(invoice?.description).toBe(invoiceData.description);
    });

    it('should create invoice without description field (optional)', async () => {
      const invoiceData = {
        clientName: 'Test Client without Description',
        clientStreet: '789 Client Street',
        clientCity: 'Client City',
        clientZipCode: '67890',
        clientCountry: 'Czech Republic',
        issueDate: '2025-08-31',
        dueDate: '2025-09-14',
        items: [
          {
            description: 'Test Service 2',
            quantity: 1,
            unitPrice: 500,
            vatRate: 21,
          },
        ],
      };

      const response = await request(app)
        .post('/api/v1/invoices')
        .set('Cookie', [`token=${authToken}`])
        .send(invoiceData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.description).toBeNull();

      // Verify in database
      const invoice = await prisma.invoice.findUnique({
        where: { id: response.body.id },
      });

      expect(invoice?.description).toBeNull();
    });

    it('should create invoice with empty description', async () => {
      const invoiceData = {
        clientName: 'Test Client with Empty Description',
        clientStreet: '999 Client Street',
        clientCity: 'Client City',
        clientZipCode: '67890',
        clientCountry: 'Czech Republic',
        issueDate: '2025-08-31',
        dueDate: '2025-09-14',
        description: '',
        items: [
          {
            description: 'Test Service 3',
            quantity: 1,
            unitPrice: 750,
            vatRate: 21,
          },
        ],
      };

      const response = await request(app)
        .post('/api/v1/invoices')
        .set('Cookie', [`token=${authToken}`])
        .send(invoiceData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.description).toBeNull(); // Empty string becomes null

      // Verify in database
      const invoice = await prisma.invoice.findUnique({
        where: { id: response.body.id },
      });

      expect(invoice?.description).toBeNull();
    });

    it('should retrieve invoice with description via GET endpoint', async () => {
      // First create an invoice with description
      const invoiceData = {
        clientName: 'Test Client for GET',
        clientStreet: '111 GET Street',
        clientCity: 'GET City',
        clientZipCode: '11111',
        clientCountry: 'Czech Republic',
        issueDate: '2025-08-31',
        dueDate: '2025-09-14',
        description: 'Description for GET test',
        items: [
          {
            description: 'GET Test Service',
            quantity: 2,
            unitPrice: 300,
            vatRate: 21,
          },
        ],
      };

      const createResponse = await request(app)
        .post('/api/v1/invoices')
        .set('Cookie', [`token=${authToken}`])
        .send(invoiceData)
        .expect(201);

      const invoiceId = createResponse.body.id;

      // Then retrieve it
      const getResponse = await request(app)
        .get(`/api/v1/invoices/${invoiceId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(getResponse.body.description).toBe(invoiceData.description);
    });

    it('should retrieve invoice without description via GET endpoint', async () => {
      // First create an invoice without description
      const invoiceData = {
        clientName: 'Test Client for GET No Desc',
        clientStreet: '222 GET Street',
        clientCity: 'GET City',
        clientZipCode: '22222',
        clientCountry: 'Czech Republic',
        issueDate: '2025-08-31',
        dueDate: '2025-09-14',
        items: [
          {
            description: 'GET Test Service No Desc',
            quantity: 1,
            unitPrice: 400,
            vatRate: 21,
          },
        ],
      };

      const createResponse = await request(app)
        .post('/api/v1/invoices')
        .set('Cookie', [`token=${authToken}`])
        .send(invoiceData)
        .expect(201);

      const invoiceId = createResponse.body.id;

      // Then retrieve it
      const getResponse = await request(app)
        .get(`/api/v1/invoices/${invoiceId}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(getResponse.body.description).toBeNull();
    });

    it('should include description in PDF data', async () => {
      // First create an invoice with description
      const invoiceData = {
        clientName: 'Test Client for PDF',
        clientStreet: '333 PDF Street',
        clientCity: 'PDF City',
        clientZipCode: '33333',
        clientCountry: 'Czech Republic',
        issueDate: '2025-08-31',
        dueDate: '2025-09-14',
        description: 'This description should appear in the PDF',
        items: [
          {
            description: 'PDF Test Service',
            quantity: 1,
            unitPrice: 800,
            vatRate: 21,
          },
        ],
      };

      const createResponse = await request(app)
        .post('/api/v1/invoices')
        .set('Cookie', [`token=${authToken}`])
        .send(invoiceData)
        .expect(201);

      const invoiceId = createResponse.body.id;

      // Get PDF (this tests that the PDF generation works with description)
      const pdfResponse = await request(app)
        .get(`/api/v1/invoices/${invoiceId}/pdf`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(pdfResponse.headers['content-type']).toBe('application/pdf');
      expect(pdfResponse.headers['content-disposition']).toContain('faktura-');
    });

    it('should handle long descriptions', async () => {
      const longDescription = 'This is a very long description '.repeat(50) +
        'that should test how the system handles large text inputs for the description field.';

      const invoiceData = {
        clientName: 'Test Client Long Description',
        clientStreet: '444 Long Street',
        clientCity: 'Long City',
        clientZipCode: '44444',
        clientCountry: 'Czech Republic',
        issueDate: '2025-08-31',
        dueDate: '2025-09-14',
        description: longDescription,
        items: [
          {
            description: 'Long Description Test Service',
            quantity: 1,
            unitPrice: 1200,
            vatRate: 21,
          },
        ],
      };

      const response = await request(app)
        .post('/api/v1/invoices')
        .set('Cookie', [`token=${authToken}`])
        .send(invoiceData)
        .expect(201);

      expect(response.body.description).toBe(longDescription);

      // Verify in database
      const invoice = await prisma.invoice.findUnique({
        where: { id: response.body.id },
      });

      expect(invoice?.description).toBe(longDescription);
    });
  });

  describe('Backwards Compatibility Tests', () => {
    it('should not break existing invoices without description', async () => {
      // This test ensures existing invoices continue to work
      const response = await request(app)
        .get('/api/v1/invoices')
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      // Should return array (even if empty)
      expect(Array.isArray(response.body)).toBe(true);

      // All invoices should have description field (nullable)
      response.body.forEach((invoice: any) => {
        expect(invoice).toHaveProperty('description');
      });
    });

    it('should handle legacy invoice data gracefully', async () => {
      // Create an invoice using direct database insertion (simulating legacy data)
      const user = await prisma.user.findFirst({ where: { email: 'description-test@example.com' } });
      const supplier = await prisma.supplier.findFirst({ where: { userId: user?.id } });

      const legacyInvoice = await prisma.invoice.create({
        data: {
          supplierId: supplier!.id,
          invoiceNumber: BigInt('2509010001'),
          clientName: 'Legacy Client',
          clientStreet: 'Legacy Street',
          clientCity: 'Legacy City',
          clientZipCode: '99999',
          clientCountry: 'Czech Republic',
          issueDate: new Date('2025-09-01'),
          dueDate: new Date('2025-09-15'),
          // Intentionally omitting description to simulate legacy data
          subtotal: 1000,
          vatAmount: 210,
          total: 1210,
          items: {
            create: [
              {
                description: 'Legacy Service',
                quantity: 1,
                unitPrice: 1000,
                lineTotal: 1000,
                vatRate: 21,
              },
            ],
          },
        },
      });

      // Should be able to retrieve this invoice
      const response = await request(app)
        .get(`/api/v1/invoices/${legacyInvoice.id}`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.body.description).toBeNull();
      expect(response.body.clientName).toBe('Legacy Client');
    });
  });
});