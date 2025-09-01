import { hashPassword, verifyPassword, generateToken, verifyToken } from '../../utils/auth';

describe('Auth Utils', () => {
  describe('Password hashing', () => {
    it('should hash a password', async () => {
      const password = 'testpassword';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should verify correct password', async () => {
      const password = 'testpassword';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testpassword';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword('wrongpassword', hash);
      
      expect(isValid).toBe(false);
    });
  });

  describe('JWT tokens', () => {
    it('should generate and verify a token', () => {
      const userId = 'test-user-id';
      const token = generateToken(userId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      const decoded = verifyToken(token);
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(userId);
    });

    it('should reject invalid token', () => {
      const decoded = verifyToken('invalid-token');
      expect(decoded).toBeNull();
    });
  });
});