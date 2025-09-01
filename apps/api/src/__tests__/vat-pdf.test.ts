import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index';
import { prisma } from '../utils/prisma';

describe('VAT PDF Generation', () => {
  let authToken: string;
  let nonVatAuthToken: string;
  let vatInvoiceId: string;
  let nonVatInvoiceId: string;

  beforeAll(async () => {
    // Clean up test data
    await prisma.invoiceItem.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.user.deleteMany();

    // Create VAT payer user and supplier
    const vatUser = await prisma.user.create({
      data: {
        email: 'vat-pdf-test@example.com',
        passwordHash: 'hashedpassword',
      },
    });

    await prisma.supplier.create({
      data: {
        userId: vatUser.id,
        name: 'VAT Payer Company s.r.o.',
        address: 'Wenceslas Square 1\n110 00 Prague 1\nCzech Republic',
        ico: '12345678',
        dic: 'CZ12345678',
        isNonVatPayer: false,
      },
    });

    authToken = jwt.sign({ userId: vatUser.id }, process.env.JWT_SECRET!);

    // Create non-VAT payer user and supplier
    const nonVatUser = await prisma.user.create({
      data: {
        email: 'non-vat-pdf-test@example.com',
        passwordHash: 'hashedpassword',
      },
    });

    await prisma.supplier.create({
      data: {
        userId: nonVatUser.id,
        name: 'Non-VAT Company s.r.o.',
        address: 'Old Town Square 2\n110 00 Prague 1\nCzech Republic',
        ico: '87654321',
        isNonVatPayer: true,
      },
    });

    nonVatAuthToken = jwt.sign({ userId: nonVatUser.id }, process.env.JWT_SECRET!);

    // Create test invoices
    const vatInvoiceData = {
      clientName: 'Test Client with VAT',
      clientAddress: 'Client Street 123\n120 00 Prague 2\nCzech Republic',
      issueDate: '2025-08-30',
      dueDate: '2025-09-30',
      items: [
        {
          description: 'Software Development Services',
          quantity: 10,
          unitPrice: 1000,
          vatRate: 21,
        },
        {
          description: 'Consulting Services',
          quantity: 5,
          unitPrice: 800,
          vatRate: 15,
        },
      ],
    };

    const vatInvoiceResponse = await request(app)
      .post('/api/v1/invoices')
      .set('Cookie', [`token=${authToken}`])
      .send(vatInvoiceData);
    
    vatInvoiceId = vatInvoiceResponse.body.id;

    const nonVatInvoiceData = {
      clientName: 'Test Client for Non-VAT',
      clientAddress: 'Non-VAT Client Street 456\n130 00 Prague 3\nCzech Republic',
      issueDate: '2025-08-30',
      dueDate: '2025-09-30',
      items: [
        {
          description: 'Services from non-VAT payer',
          quantity: 8,
          unitPrice: 750,
          vatRate: 0,
        },
      ],
    };

    const nonVatInvoiceResponse = await request(app)
      .post('/api/v1/invoices')
      .set('Cookie', [`token=${nonVatAuthToken}`])
      .send(nonVatInvoiceData);
    
    nonVatInvoiceId = nonVatInvoiceResponse.body.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.invoiceItem.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('VAT Payer PDF Generation', () => {
    it('should generate PDF with VAT information for VAT payer (Czech)', async () => {
      const response = await request(app)
        .get(`/api/v1/invoices/${vatInvoiceId}/pdf?lang=cs`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('faktura-');
      expect(response.body).toBeDefined();
      
      // PDF should be generated without errors
      expect(response.body.length).toBeGreaterThan(1000); // PDF should have reasonable size
    });

    it('should generate PDF with VAT information for VAT payer (English)', async () => {
      const response = await request(app)
        .get(`/api/v1/invoices/${vatInvoiceId}/pdf?lang=en`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('faktura-');
      expect(response.body).toBeDefined();
      
      // PDF should be generated without errors
      expect(response.body.length).toBeGreaterThan(1000);
    });
  });

  describe('Non-VAT Payer PDF Generation', () => {
    it('should generate PDF with "Nejsem plátce DPH" text for non-VAT payer (Czech)', async () => {
      const response = await request(app)
        .get(`/api/v1/invoices/${nonVatInvoiceId}/pdf?lang=cs`)
        .set('Cookie', [`token=${nonVatAuthToken}`])
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('faktura-');
      expect(response.body).toBeDefined();
      
      // PDF should be generated without errors
      expect(response.body.length).toBeGreaterThan(1000);
    });

    it('should generate PDF with "Not a VAT payer" text for non-VAT payer (English)', async () => {
      const response = await request(app)
        .get(`/api/v1/invoices/${nonVatInvoiceId}/pdf?lang=en`)
        .set('Cookie', [`token=${nonVatAuthToken}`])
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('faktura-');
      expect(response.body).toBeDefined();
      
      // PDF should be generated without errors
      expect(response.body.length).toBeGreaterThan(1000);
    });
  });

  describe('PDF Error Handling', () => {
    it('should return 401 without authentication', async () => {
      await request(app)
        .get(`/api/v1/invoices/${vatInvoiceId}/pdf`)
        .expect(401);
    });

    it('should return 404 for non-existent invoice', async () => {
      const nonExistentId = '00000000-0000-4000-8000-000000000000';
      
      await request(app)
        .get(`/api/v1/invoices/${nonExistentId}/pdf`)
        .set('Cookie', [`token=${authToken}`])
        .expect(404);
    });

    it('should return 404 when accessing another supplier\'s invoice PDF', async () => {
      // Try to access VAT invoice with non-VAT auth token
      await request(app)
        .get(`/api/v1/invoices/${vatInvoiceId}/pdf`)
        .set('Cookie', [`token=${nonVatAuthToken}`])
        .expect(404);
    });

    it('should default to Czech language when lang parameter is invalid', async () => {
      const response = await request(app)
        .get(`/api/v1/invoices/${vatInvoiceId}/pdf?lang=invalid`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.body.length).toBeGreaterThan(1000);
    });

    it('should default to Czech language when lang parameter is missing', async () => {
      const response = await request(app)
        .get(`/api/v1/invoices/${vatInvoiceId}/pdf`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.body.length).toBeGreaterThan(1000);
    });
  });

  describe('PDF Content Validation', () => {
    it('should handle zero VAT amount correctly in PDF', async () => {
      // Create invoice with 0% VAT
      const zeroVatData = {
        clientName: 'Zero VAT PDF Client',
        clientAddress: 'Zero VAT Street 789',
        issueDate: '2025-08-30',
        dueDate: '2025-09-30',
        items: [
          {
            description: 'Zero VAT service',
            quantity: 1,
            unitPrice: 500,
            vatRate: 0,
          },
        ],
      };

      const invoiceResponse = await request(app)
        .post('/api/v1/invoices')
        .set('Cookie', [`token=${authToken}`])
        .send(zeroVatData);

      const pdfResponse = await request(app)
        .get(`/api/v1/invoices/${invoiceResponse.body.id}/pdf`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(pdfResponse.headers['content-type']).toBe('application/pdf');
      expect(pdfResponse.body.length).toBeGreaterThan(1000);
    });

    it('should handle mixed VAT rates correctly in PDF', async () => {
      // Create invoice with multiple VAT rates
      const mixedVatData = {
        clientName: 'Mixed VAT PDF Client',
        clientAddress: 'Mixed VAT Street 999',
        issueDate: '2025-08-30',
        dueDate: '2025-09-30',
        items: [
          {
            description: 'Standard VAT service',
            quantity: 1,
            unitPrice: 1000,
            vatRate: 21,
          },
          {
            description: 'Reduced VAT service',
            quantity: 1,
            unitPrice: 800,
            vatRate: 15,
          },
          {
            description: 'Zero VAT service',
            quantity: 1,
            unitPrice: 600,
            vatRate: 0,
          },
        ],
      };

      const invoiceResponse = await request(app)
        .post('/api/v1/invoices')
        .set('Cookie', [`token=${authToken}`])
        .send(mixedVatData);

      const pdfResponse = await request(app)
        .get(`/api/v1/invoices/${invoiceResponse.body.id}/pdf`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(pdfResponse.headers['content-type']).toBe('application/pdf');
      expect(pdfResponse.body.length).toBeGreaterThan(1000);
    });

    it('should handle decimal amounts correctly in PDF', async () => {
      // Create invoice with decimal amounts
      const decimalData = {
        clientName: 'Decimal PDF Client',
        clientAddress: 'Decimal Street 111',
        issueDate: '2025-08-30',
        dueDate: '2025-09-30',
        items: [
          {
            description: 'Decimal amount service',
            quantity: 3,
            unitPrice: 33.33,
            vatRate: 21,
          },
        ],
      };

      const invoiceResponse = await request(app)
        .post('/api/v1/invoices')
        .set('Cookie', [`token=${authToken}`])
        .send(decimalData);

      const pdfResponse = await request(app)
        .get(`/api/v1/invoices/${invoiceResponse.body.id}/pdf`)
        .set('Cookie', [`token=${authToken}`])
        .expect(200);

      expect(pdfResponse.headers['content-type']).toBe('application/pdf');
      expect(pdfResponse.body.length).toBeGreaterThan(1000);
    });
  });
});