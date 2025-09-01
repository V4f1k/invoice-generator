import request from 'supertest';
import app from '../index';

// Mock the PDF generator to avoid running Puppeteer in tests
jest.mock('../services/pdfGenerator', () => ({
  pdfGenerator: {
    generateInvoicePDF: jest.fn().mockResolvedValue(Buffer.from('mock-pdf-content')),
  },
}));

describe('PDF Generation API', () => {

  describe('GET /api/v1/invoices/:id/pdf', () => {
    it('should return 401 without authentication', async () => {
      const testId = '00000000-0000-0000-0000-000000000000';
      
      await request(app)
        .get(`/api/v1/invoices/${testId}/pdf`)
        .expect(401);
    });
  });
});