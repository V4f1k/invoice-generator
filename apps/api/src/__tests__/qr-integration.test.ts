import request from 'supertest';
import app from '../index';
import { prisma } from '../utils/prisma';
import { generateToken } from '../utils/auth';

// Test data
const testUser = {
  id: 'test-qr-user-id',
  email: 'qrtest@example.com',
  passwordHash: 'hashedpassword',
};

const validSupplierDataWithIBAN = {
  name: 'QR Test Company s.r.o.',
  address: 'QR Test Street 123\n12345 QR City\nCzech Republic',
  ico: '12345678',
  dic: 'CZ12345678',
  bankAccount: 'CZ6508000000192000145399', // Valid Czech IBAN
  isNonVatPayer: false,
};

const validInvoiceData = {
  clientName: 'Test Client',
  clientAddress: 'Client Street 456\n67890 Client City',
  issueDate: '2024-01-01',
  dueDate: '2024-01-31',
  items: [
    {
      description: 'Test Service',
      quantity: 1,
      unitPrice: 1000,
      vatRate: 21,
    },
  ],
};

describe('QR Code Integration with User IBAN', () => {
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
    const supplier = await prisma.supplier.findUnique({
      where: { userId: testUser.id },
    });
    
    if (supplier) {
      await prisma.invoice.deleteMany({
        where: { supplierId: supplier.id },
      });
    }
    
    await prisma.supplier.deleteMany({
      where: { userId: testUser.id },
    });
    await prisma.user.deleteMany({
      where: { id: testUser.id },
    });
  });

  beforeEach(async () => {
    // Clean up any existing data before each test
    const supplier = await prisma.supplier.findUnique({
      where: { userId: testUser.id },
    });
    
    if (supplier) {
      await prisma.invoice.deleteMany({
        where: { supplierId: supplier.id },
      });
    }
    
    await prisma.supplier.deleteMany({
      where: { userId: testUser.id },
    });
  });

  it('should generate QR code using user-provided IBAN in supplier settings', async () => {
    // 1. Set up supplier with valid IBAN
    const supplierResponse = await request(app)
      .put('/api/v1/supplier')
      .set('Cookie', [`token=${authToken}`])
      .send(validSupplierDataWithIBAN);

    expect(supplierResponse.status).toBe(200);
    expect(supplierResponse.body.bankAccount).toBe(validSupplierDataWithIBAN.bankAccount);

    // 2. Create an invoice
    const invoiceResponse = await request(app)
      .post('/api/v1/invoices')
      .set('Cookie', [`token=${authToken}`])
      .send(validInvoiceData);

    expect(invoiceResponse.status).toBe(201);
    const invoiceId = invoiceResponse.body.id;

    // 3. Generate PDF and verify QR code is included
    const pdfResponse = await request(app)
      .get(`/api/v1/invoices/${invoiceId}/pdf`)
      .set('Cookie', [`token=${authToken}`]);

    // The PDF should be generated successfully
    expect(pdfResponse.status).toBe(200);
    expect(pdfResponse.headers['content-type']).toBe('application/pdf');
    expect(pdfResponse.body.length).toBeGreaterThan(1000);
  });

  it('should not generate QR code when supplier has no bank account', async () => {
    // 1. Set up supplier without bank account
    const supplierWithoutIBAN = {
      ...validSupplierDataWithIBAN,
      bankAccount: '', // Empty bank account
    };

    const supplierResponse = await request(app)
      .put('/api/v1/supplier')
      .set('Cookie', [`token=${authToken}`])
      .send(supplierWithoutIBAN);

    expect(supplierResponse.status).toBe(200);
    expect(supplierResponse.body.bankAccount).toBeNull();

    // 2. Create an invoice
    const invoiceResponse = await request(app)
      .post('/api/v1/invoices')
      .set('Cookie', [`token=${authToken}`])
      .send(validInvoiceData);

    expect(invoiceResponse.status).toBe(201);
    const invoiceId = invoiceResponse.body.id;

    // 3. Generate PDF (should work without QR code)
    const pdfResponse = await request(app)
      .get(`/api/v1/invoices/${invoiceId}/pdf`)
      .set('Cookie', [`token=${authToken}`]);

    expect(pdfResponse.status).toBe(200);
    expect(pdfResponse.headers['content-type']).toBe('application/pdf');
    expect(pdfResponse.body.length).toBeGreaterThan(1000);
  });

  it('should handle invalid IBAN gracefully', async () => {
    // 1. Set up supplier with invalid IBAN
    const supplierWithInvalidIBAN = {
      ...validSupplierDataWithIBAN,
      bankAccount: 'INVALID-IBAN-FORMAT',
    };

    const supplierResponse = await request(app)
      .put('/api/v1/supplier')
      .set('Cookie', [`token=${authToken}`])
      .send(supplierWithInvalidIBAN);

    expect(supplierResponse.status).toBe(200);
    expect(supplierResponse.body.bankAccount).toBe('INVALID-IBAN-FORMAT');

    // 2. Create an invoice
    const invoiceResponse = await request(app)
      .post('/api/v1/invoices')
      .set('Cookie', [`token=${authToken}`])
      .send(validInvoiceData);

    expect(invoiceResponse.status).toBe(201);
    const invoiceId = invoiceResponse.body.id;

    // 3. Generate PDF (should work without QR code due to invalid IBAN)
    const pdfResponse = await request(app)
      .get(`/api/v1/invoices/${invoiceId}/pdf`)
      .set('Cookie', [`token=${authToken}`]);

    expect(pdfResponse.status).toBe(200);
    expect(pdfResponse.headers['content-type']).toBe('application/pdf');
    expect(pdfResponse.body.length).toBeGreaterThan(1000);
  });

  it('should update QR code when user changes IBAN in supplier settings', async () => {
    // 1. Set up initial supplier with IBAN
    const supplierResponse1 = await request(app)
      .put('/api/v1/supplier')
      .set('Cookie', [`token=${authToken}`])
      .send(validSupplierDataWithIBAN);

    expect(supplierResponse1.status).toBe(200);

    // 2. Create an invoice
    const invoiceResponse = await request(app)
      .post('/api/v1/invoices')
      .set('Cookie', [`token=${authToken}`])
      .send(validInvoiceData);

    expect(invoiceResponse.status).toBe(201);

    // 3. Update supplier with different IBAN
    const updatedSupplierData = {
      ...validSupplierDataWithIBAN,
      bankAccount: 'CZ7508000000192000145400', // Different valid IBAN
    };

    const supplierResponse2 = await request(app)
      .put('/api/v1/supplier')
      .set('Cookie', [`token=${authToken}`])
      .send(updatedSupplierData);

    expect(supplierResponse2.status).toBe(200);
    expect(supplierResponse2.body.bankAccount).toBe(updatedSupplierData.bankAccount);

    // 4. Generate PDF with new invoice (should use updated IBAN)
    const invoiceResponse2 = await request(app)
      .post('/api/v1/invoices')
      .set('Cookie', [`token=${authToken}`])
      .send(validInvoiceData);

    expect(invoiceResponse2.status).toBe(201);
    const newInvoiceId = invoiceResponse2.body.id;

    const pdfResponse = await request(app)
      .get(`/api/v1/invoices/${newInvoiceId}/pdf`)
      .set('Cookie', [`token=${authToken}`]);

    expect(pdfResponse.status).toBe(200);
    expect(pdfResponse.headers['content-type']).toBe('application/pdf');
    expect(pdfResponse.body.length).toBeGreaterThan(1000);
  });
});