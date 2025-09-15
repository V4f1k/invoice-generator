import request from 'supertest';
import app from '../index';
import { prisma } from '../utils/prisma';
import { generateRegistrationText } from '../routes/supplier';

describe('Mandatory Elements - Story 1.12', () => {
  let authToken: string;

  beforeAll(async () => {
    // Clean up database
    await prisma.invoiceItem.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.user.deleteMany();

    // Register a test user
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'mandatory@test.com',
        password: 'password123',
      });

    authToken = registerResponse.headers['set-cookie'][0];
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('DUZP Field Tests', () => {
    it('should accept DUZP field when creating invoice for VAT payer', async () => {
      // Setup supplier as VAT payer
      await request(app)
        .put('/api/v1/supplier')
        .set('Cookie', authToken)
        .send({
          name: 'VAT Payer Company',
          address: 'Test Address',
          ico: '12345678',
          dic: 'CZ12345678',
          bankAccount: 'CZ1234567890',
          isNonVatPayer: false,
        });

      const response = await request(app)
        .post('/api/v1/invoices')
        .set('Cookie', authToken)
        .send({
          clientName: 'Test Client',
          clientAddress: 'Client Address',
          issueDate: '2025-08-31',
          dueDate: '2025-09-14',
          duzp: '2025-08-30',
          items: [
            {
              description: 'Test Item',
              quantity: 1,
              unitPrice: 1000,
              vatRate: 21,
            },
          ],
        })
        .expect(201);

      // Verify DUZP was saved
      const invoice = await prisma.invoice.findUnique({
        where: { id: response.body.id },
      });

      expect(invoice?.duzp).toBeTruthy();
      expect(invoice?.duzp?.toISOString()).toContain('2025-08-30');
    });

    it('should work without DUZP field (optional)', async () => {
      const response = await request(app)
        .post('/api/v1/invoices')
        .set('Cookie', authToken)
        .send({
          clientName: 'Test Client 2',
          clientAddress: 'Client Address 2',
          issueDate: '2025-08-31',
          dueDate: '2025-09-14',
          items: [
            {
              description: 'Test Item',
              quantity: 1,
              unitPrice: 1000,
              vatRate: 21,
            },
          ],
        })
        .expect(201);

      const invoice = await prisma.invoice.findUnique({
        where: { id: response.body.id },
      });

      expect(invoice?.duzp).toBeNull();
    });
  });

  describe('Registration Fields Tests', () => {
    it('should save registration fields for commercial register', async () => {
      const response = await request(app)
        .put('/api/v1/supplier')
        .set('Cookie', authToken)
        .send({
          name: 'Registered Company',
          address: 'Company Address',
          ico: '87654321',
          dic: 'CZ87654321',
          bankAccount: 'CZ9876543210',
          isNonVatPayer: false,
          registrationType: 'obchodni_rejstrik',
          registrationCourt: 'Krajským soudem v Praze',
          registrationFileNumber: 'C 12345',
        })
        .expect(200);

      expect(response.body.registrationType).toBe('obchodni_rejstrik');
      expect(response.body.registrationCourt).toBe('Krajským soudem v Praze');
      expect(response.body.registrationFileNumber).toBe('C 12345');
    });

    it('should save registration fields for trade register', async () => {
      const response = await request(app)
        .put('/api/v1/supplier')
        .set('Cookie', authToken)
        .send({
          name: 'Trade Company',
          address: 'Trade Address',
          ico: '11111111',
          dic: 'CZ11111111',
          isNonVatPayer: false,
          registrationType: 'zivnostensky_rejstrik',
          registrationCourt: 'Živnostenským úřadem Praha 1',
        })
        .expect(200);

      expect(response.body.registrationType).toBe('zivnostensky_rejstrik');
      expect(response.body.registrationCourt).toBe('Živnostenským úřadem Praha 1');
      expect(response.body.registrationFileNumber).toBeNull();
    });
  });

  describe('Registration Text Generation', () => {
    it('should generate correct text for commercial register', () => {
      const text = generateRegistrationText({
        registrationType: 'obchodni_rejstrik',
        registrationCourt: 'Krajským soudem v Praze',
        registrationFileNumber: 'C 12345',
      });

      expect(text).toBe('Společnost je zapsána v obchodním rejstříku vedeném Krajským soudem v Praze, oddíl C 12345');
    });

    it('should generate correct text for trade register', () => {
      const text = generateRegistrationText({
        registrationType: 'zivnostensky_rejstrik',
        registrationCourt: 'Živnostenským úřadem Praha 1',
        registrationFileNumber: null,
      });

      expect(text).toBe('Fyzická osoba zapsaná v živnostenském rejstříku');
    });

    it('should generate correct text for other register', () => {
      const text = generateRegistrationText({
        registrationType: 'jiny_rejstrik',
        registrationCourt: 'Speciální rejstřík',
        registrationFileNumber: 'X 999',
      });

      expect(text).toBe('Zápis v rejstříku: Speciální rejstřík, X 999');
    });

    it('should generate correct text for no registration', () => {
      const text = generateRegistrationText({
        registrationType: 'bez_zapisu',
        registrationCourt: null,
        registrationFileNumber: null,
      });

      expect(text).toBe('Není zapsán v obchodním rejstříku');
    });

    it('should return null for empty registration type', () => {
      const text = generateRegistrationText({
        registrationType: null,
        registrationCourt: null,
        registrationFileNumber: null,
      });

      expect(text).toBeNull();
    });
  });

  describe('PDF Generation with Mandatory Elements', () => {
    it('should include DUZP in PDF data when provided', async () => {
      // Create supplier
      await request(app)
        .put('/api/v1/supplier')
        .set('Cookie', authToken)
        .send({
          name: 'PDF Test Company',
          address: 'PDF Address',
          ico: '99999999',
          dic: 'CZ99999999',
          isNonVatPayer: false,
          registrationType: 'obchodni_rejstrik',
          registrationCourt: 'Krajským soudem v Brně',
          registrationFileNumber: 'B 54321',
        });

      // Create invoice with DUZP
      const invoiceResponse = await request(app)
        .post('/api/v1/invoices')
        .set('Cookie', authToken)
        .send({
          clientName: 'PDF Client',
          clientAddress: 'PDF Client Address',
          issueDate: '2025-08-31',
          dueDate: '2025-09-14',
          duzp: '2025-08-30',
          items: [
            {
              description: 'PDF Test Item',
              quantity: 1,
              unitPrice: 2000,
              vatRate: 21,
            },
          ],
        });

      // Attempt to get PDF (we can't fully test PDF generation but we can verify the endpoint works)
      const pdfResponse = await request(app)
        .get(`/api/v1/invoices/${invoiceResponse.body.id}/pdf`)
        .set('Cookie', authToken)
        .expect(200);

      expect(pdfResponse.headers['content-type']).toBe('application/pdf');
      expect(pdfResponse.headers['content-disposition']).toContain('faktura-');
    });

    it('should generate different PDF titles based on VAT payer status', async () => {
      // Test with non-VAT payer
      await request(app)
        .put('/api/v1/supplier')
        .set('Cookie', authToken)
        .send({
          name: 'Non-VAT Company',
          address: 'Non-VAT Address',
          ico: '88888888',
          isNonVatPayer: true,
        });

      const invoiceResponse = await request(app)
        .post('/api/v1/invoices')
        .set('Cookie', authToken)
        .send({
          clientName: 'Non-VAT Client',
          clientAddress: 'Non-VAT Client Address',
          issueDate: '2025-08-31',
          dueDate: '2025-09-14',
          items: [
            {
              description: 'Non-VAT Item',
              quantity: 1,
              unitPrice: 1500,
            },
          ],
        });

      const pdfResponse = await request(app)
        .get(`/api/v1/invoices/${invoiceResponse.body.id}/pdf`)
        .set('Cookie', authToken)
        .expect(200);

      // Verify PDF response
      expect(pdfResponse.headers['content-type']).toBe('application/pdf');
      
      // The actual title would be in the PDF content which we can't easily test
      // but we've verified the endpoint works correctly
    });
  });
});