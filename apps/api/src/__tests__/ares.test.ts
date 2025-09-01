import request from 'supertest';
import app from '../index';
import { prisma } from '../utils/prisma';

describe('ARES Integration - Story 1.14', () => {
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
        email: 'ares@test.com',
        password: 'password123',
      });

    authToken = registerResponse.headers['set-cookie'][0];
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('ARES Endpoint Tests', () => {
    it('should reject invalid ICO format', async () => {
      const response = await request(app)
        .get('/api/v1/ares/123')
        .set('Cookie', authToken)
        .expect(400);

      expect(response.body.error).toBe('Invalid ICO format');
      expect(response.body.message).toBe('ICO must be exactly 8 digits');
    });

    it('should reject ICO with invalid checksum', async () => {
      const response = await request(app)
        .get('/api/v1/ares/12345678')
        .set('Cookie', authToken)
        .expect(400);

      expect(response.body.error).toBe('Invalid ICO');
      expect(response.body.message).toBe('ICO checksum validation failed');
    });

    it('should handle non-existent ICO', async () => {
      // Using a valid checksum ICO that likely doesn't exist
      const response = await request(app)
        .get('/api/v1/ares/00000001')
        .set('Cookie', authToken)
        .expect(404);

      expect(response.body.error).toBe('ICO not found');
      expect(response.body.message).toBe('Company with this ICO was not found in ARES');
    });

    it('should successfully lookup valid ICO', async () => {
      // Using a known valid ICO (example - may need adjustment for real testing)
      // This test may fail in CI/CD without internet access
      const validIco = '27074358'; // Valid Czech ICO with correct checksum
      
      const response = await request(app)
        .get(`/api/v1/ares/${validIco}`)
        .set('Cookie', authToken);

      if (response.status === 200) {
        // If ARES is available and ICO exists
        expect(response.body).toHaveProperty('ico');
        expect(response.body).toHaveProperty('name');
        expect(response.body).toHaveProperty('address');
        expect(response.body).toHaveProperty('registration');
        expect(response.body).toHaveProperty('isActive');
        
        expect(response.body.ico).toBe(validIco);
        expect(response.body.address).toHaveProperty('street');
        expect(response.body.address).toHaveProperty('city');
        expect(response.body.address).toHaveProperty('zipCode');
        expect(response.body.address).toHaveProperty('country');
        
        expect(response.body.registration).toHaveProperty('registrationType');
      } else if (response.status === 404) {
        // ICO not found - acceptable for test
        expect(response.body.error).toBe('ICO not found');
      } else if (response.status === 500) {
        // Network error or ARES unavailable - skip test
        console.warn('ARES service unavailable during testing');
      }
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/v1/ares/27074358')
        .expect(401);
    });
  });

  describe('ARES Checksum Validation', () => {
    // Test various ICO checksum validations
    const validIcos = [
      '27074358', // Example valid ICO
      '25596641', // Another example
    ];

    const invalidIcos = [
      '12345678', // Invalid checksum
      '87654321', // Invalid checksum
      '11111111', // Invalid checksum
    ];

    validIcos.forEach(ico => {
      it(`should accept valid ICO ${ico}`, async () => {
        const response = await request(app)
          .get(`/api/v1/ares/${ico}`)
          .set('Cookie', authToken);

        // Should not reject due to checksum (may still be 404 if doesn't exist)
        expect(response.status).not.toBe(400);
      });
    });

    invalidIcos.forEach(ico => {
      it(`should reject invalid ICO ${ico}`, async () => {
        const response = await request(app)
          .get(`/api/v1/ares/${ico}`)
          .set('Cookie', authToken)
          .expect(400);

        expect(response.body.error).toBe('Invalid ICO');
      });
    });
  });
});