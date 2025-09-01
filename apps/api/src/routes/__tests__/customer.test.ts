import request from 'supertest';
import app from '../../index';
import { prisma } from '../../utils/prisma';
import jwt from 'jsonwebtoken';

// Mock prisma
jest.mock('../../utils/prisma', () => ({
  prisma: {
    customer: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

describe('Customer Routes', () => {
  let authToken: string;
  const mockUserId = 'test-user-id';

  beforeAll(() => {
    // Create a mock JWT token for testing
    authToken = jwt.sign({ userId: mockUserId }, process.env.JWT_SECRET || 'test-secret');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/customers', () => {
    it('should return customers for authenticated user', async () => {
      const mockCustomers = [
        {
          id: '1',
          userId: mockUserId,
          name: 'Test Customer',
          street: 'Test Street 1',
          city: 'Test City',
          zipCode: '12345',
          country: 'Czech Republic',
          ico: null,
          dic: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.customer.findMany as jest.Mock).mockResolvedValue(mockCustomers);

      const response = await request(app)
        .get('/api/v1/customers')
        .set('Cookie', [`auth-token=${authToken}`])
        .expect(200);

      expect(response.body).toEqual(mockCustomers);
      expect(prisma.customer.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/v1/customers')
        .expect(401);
    });
  });

  describe('POST /api/v1/customers', () => {
    it('should create a new customer', async () => {
      const customerData = {
        name: 'New Customer',
        street: 'New Street 1',
        city: 'New City',
        zipCode: '54321',
        country: 'Czech Republic',
        ico: '12345678',
        dic: 'CZ12345678',
      };

      const mockCreatedCustomer = {
        id: '2',
        userId: mockUserId,
        ...customerData,
        ico: customerData.ico,
        dic: customerData.dic,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.customer.create as jest.Mock).mockResolvedValue(mockCreatedCustomer);

      const response = await request(app)
        .post('/api/v1/customers')
        .set('Cookie', [`auth-token=${authToken}`])
        .send(customerData)
        .expect(201);

      expect(response.body).toEqual(mockCreatedCustomer);
      expect(prisma.customer.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          name: customerData.name,
          street: customerData.street,
          city: customerData.city,
          zipCode: customerData.zipCode,
          country: customerData.country,
          ico: customerData.ico,
          dic: customerData.dic,
        },
      });
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        name: '', // Required field empty
        street: 'Test Street',
        city: 'Test City',
        zipCode: '12345',
        country: 'Czech Republic',
      };

      await request(app)
        .post('/api/v1/customers')
        .set('Cookie', [`auth-token=${authToken}`])
        .send(invalidData)
        .expect(400);
    });
  });

  describe('PUT /api/v1/customers/:id', () => {
    it('should update an existing customer', async () => {
      const customerId = 'customer-1';
      const updateData = {
        name: 'Updated Customer',
        street: 'Updated Street 1',
        city: 'Updated City',
        zipCode: '99999',
        country: 'Czech Republic',
        ico: '87654321',
        dic: 'CZ87654321',
      };

      const mockExistingCustomer = {
        id: customerId,
        userId: mockUserId,
        name: 'Old Customer',
        street: 'Old Street',
        city: 'Old City',
        zipCode: '11111',
        country: 'Czech Republic',
        ico: null,
        dic: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedCustomer = {
        ...mockExistingCustomer,
        ...updateData,
        updatedAt: new Date(),
      };

      (prisma.customer.findFirst as jest.Mock).mockResolvedValue(mockExistingCustomer);
      (prisma.customer.update as jest.Mock).mockResolvedValue(mockUpdatedCustomer);

      const response = await request(app)
        .put(`/api/v1/customers/${customerId}`)
        .set('Cookie', [`auth-token=${authToken}`])
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual(mockUpdatedCustomer);
      expect(prisma.customer.findFirst).toHaveBeenCalledWith({
        where: { id: customerId, userId: mockUserId },
      });
      expect(prisma.customer.update).toHaveBeenCalledWith({
        where: { id: customerId },
        data: {
          name: updateData.name,
          street: updateData.street,
          city: updateData.city,
          zipCode: updateData.zipCode,
          country: updateData.country,
          ico: updateData.ico,
          dic: updateData.dic,
        },
      });
    });

    it('should return 404 for non-existent customer', async () => {
      const customerId = 'non-existent';
      const updateData = {
        name: 'Updated Customer',
        street: 'Updated Street 1',
        city: 'Updated City',
        zipCode: '99999',
        country: 'Czech Republic',
      };

      (prisma.customer.findFirst as jest.Mock).mockResolvedValue(null);

      await request(app)
        .put(`/api/v1/customers/${customerId}`)
        .set('Cookie', [`auth-token=${authToken}`])
        .send(updateData)
        .expect(404);
    });
  });

  describe('DELETE /api/v1/customers/:id', () => {
    it('should delete an existing customer', async () => {
      const customerId = 'customer-1';

      const mockExistingCustomer = {
        id: customerId,
        userId: mockUserId,
        name: 'Customer to Delete',
        street: 'Test Street',
        city: 'Test City',
        zipCode: '12345',
        country: 'Czech Republic',
        ico: null,
        dic: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.customer.findFirst as jest.Mock).mockResolvedValue(mockExistingCustomer);
      (prisma.customer.delete as jest.Mock).mockResolvedValue(mockExistingCustomer);

      await request(app)
        .delete(`/api/v1/customers/${customerId}`)
        .set('Cookie', [`auth-token=${authToken}`])
        .expect(204);

      expect(prisma.customer.findFirst).toHaveBeenCalledWith({
        where: { id: customerId, userId: mockUserId },
      });
      expect(prisma.customer.delete).toHaveBeenCalledWith({
        where: { id: customerId },
      });
    });

    it('should return 404 for non-existent customer', async () => {
      const customerId = 'non-existent';

      (prisma.customer.findFirst as jest.Mock).mockResolvedValue(null);

      await request(app)
        .delete(`/api/v1/customers/${customerId}`)
        .set('Cookie', [`auth-token=${authToken}`])
        .expect(404);
    });
  });

  describe('Authorization', () => {
    it('should not allow access to other users customers', async () => {
      const customerId = 'customer-1';
      
      // Mock finding customer that belongs to different user
      (prisma.customer.findFirst as jest.Mock).mockResolvedValue(null);

      await request(app)
        .put(`/api/v1/customers/${customerId}`)
        .set('Cookie', [`auth-token=${authToken}`])
        .send({
          name: 'Hacked Customer',
          street: 'Hacker Street',
          city: 'Hack City',
          zipCode: '66666',
          country: 'Czech Republic',
        })
        .expect(404); // Should return 404 instead of allowing unauthorized access
    });
  });
});