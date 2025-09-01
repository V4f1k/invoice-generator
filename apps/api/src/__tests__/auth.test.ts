import request from 'supertest';
import app from '../index';
import { prisma } from '../utils/prisma';

describe('Authentication', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201);

      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should reject duplicate emails', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password456',
        })
        .expect(409);

      expect(response.body.error).toBe('Email already registered');
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);

      expect(response.body.error).toBe('Invalid email format');
    });

    it('should reject short passwords', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'short',
        })
        .expect(400);

      expect(response.body.error).toBe('Password must be at least 8 characters long');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.message).toBe('Login successful');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });
  });

  describe('Protected routes', () => {
    let token: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      
      token = response.headers['set-cookie'][0];
    });

    it('should access protected route with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/me')
        .set('Cookie', token)
        .expect(200);

      expect(response.body.message).toBe('This is a protected route');
      expect(response.body.userId).toBeDefined();
    });

    it('should reject access without token', async () => {
      const response = await request(app)
        .get('/api/v1/me')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized - No token provided');
    });
  });
});