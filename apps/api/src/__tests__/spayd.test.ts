import { SPAYDGenerator } from '../utils/spaydGenerator';

describe('SPAYD Generator', () => {
  describe('generateSPAYDString', () => {
    it('should generate valid SPAYD string with required fields', () => {
      const options = {
        iban: 'CZ6508000000192000145399',
        amount: 1500.50,
      };

      const result = SPAYDGenerator.generateSPAYDString(options);
      
      expect(result).toBe('SPD*1.0*ACC:CZ6508000000192000145399*AM:1500.50*CC:CZK');
    });

    it('should generate SPAYD string with all optional fields', () => {
      const options = {
        iban: 'CZ6508000000192000145399',
        amount: 2500.00,
        currency: 'EUR',
        message: 'Invoice payment',
        variableSymbol: '123456',
        constantSymbol: '0308',
        specificSymbol: '789',
        recipientName: 'Test Company s.r.o.',
      };

      const result = SPAYDGenerator.generateSPAYDString(options);
      
      expect(result).toContain('SPD*1.0*ACC:CZ6508000000192000145399*AM:2500.00*CC:EUR');
      expect(result).toContain('MSG:Invoice payment');
      expect(result).toContain('X-VS:123456');
      expect(result).toContain('X-KS:0308');
      expect(result).toContain('X-SS:789');
      expect(result).toContain('RN:Test Company s.r.o.');
    });

    it('should throw error when IBAN is missing', () => {
      expect(() => {
        SPAYDGenerator.generateSPAYDString({
          iban: '',
          amount: 1000,
        });
      }).toThrow('IBAN and amount are required for SPAYD generation');
    });

    it('should throw error when amount is missing', () => {
      expect(() => {
        SPAYDGenerator.generateSPAYDString({
          iban: 'CZ6508000000192000145399',
          amount: 0,
        });
      }).toThrow('IBAN and amount are required for SPAYD generation');
    });

    it('should limit message to 60 characters', () => {
      const longMessage = 'This is a very long message that exceeds the 60 character limit for SPAYD specification';
      const options = {
        iban: 'CZ6508000000192000145399',
        amount: 1000,
        message: longMessage,
      };

      const result = SPAYDGenerator.generateSPAYDString(options);
      const messageMatch = result.match(/MSG:([^*]+)/);
      
      expect(messageMatch).toBeTruthy();
      expect(messageMatch![1].length).toBeLessThanOrEqual(60);
    });

    it('should limit recipient name to 35 characters', () => {
      const longName = 'Very Long Company Name That Exceeds The Limit';
      const options = {
        iban: 'CZ6508000000192000145399',
        amount: 1000,
        recipientName: longName,
      };

      const result = SPAYDGenerator.generateSPAYDString(options);
      const nameMatch = result.match(/RN:([^*]+)/);
      
      expect(nameMatch).toBeTruthy();
      expect(nameMatch![1].length).toBeLessThanOrEqual(35);
    });

    it('should format amount with 2 decimal places', () => {
      const options = {
        iban: 'CZ6508000000192000145399',
        amount: 1000,
      };

      const result = SPAYDGenerator.generateSPAYDString(options);
      
      expect(result).toContain('AM:1000.00');
    });
  });

  describe('generateInvoiceQRCode', () => {
    it('should generate QR code for invoice with client name in message', async () => {
      const result = await SPAYDGenerator.generateInvoiceQRCode(
        123,
        1500.50,
        'CZ6508000000192000145399',
        'Test Client Ltd.',
        'Test Company'
      );

      expect(result).toMatch(/^data:image\/png;base64,/);
    });

    it('should handle invoice QR code generation without supplier name', async () => {
      const result = await SPAYDGenerator.generateInvoiceQRCode(
        456,
        2000.00,
        'CZ6508000000192000145399',
        'Another Client Corp.'
      );

      expect(result).toMatch(/^data:image\/png;base64,/);
    });

    it('should use client name as message in SPAYD string', async () => {
      const clientName = 'ABC Corporation s.r.o.';
      
      // Mock the generateQRCode method to capture the options passed to it
      const originalGenerateQRCode = SPAYDGenerator.generateQRCode;
      let capturedOptions: any;
      
      SPAYDGenerator.generateQRCode = jest.fn().mockImplementation((options) => {
        capturedOptions = options;
        return Promise.resolve('data:image/png;base64,test');
      });

      await SPAYDGenerator.generateInvoiceQRCode(
        2508310001,
        1500.50,
        'CZ6508000000192000145399',
        clientName,
        'Supplier Ltd.'
      );

      expect(capturedOptions.message).toBe(clientName);
      expect(capturedOptions.variableSymbol).toBe('2508310001');
      expect(capturedOptions.recipientName).toBe('Supplier Ltd.');
      
      // Restore original method
      SPAYDGenerator.generateQRCode = originalGenerateQRCode;
    });
  });

  describe('isValidIBAN', () => {
    it('should validate correct Czech IBAN', () => {
      const validIBAN = 'CZ6508000000192000145399';
      expect(SPAYDGenerator.isValidIBAN(validIBAN)).toBe(true);
    });

    it('should validate Czech IBAN with spaces', () => {
      const validIBAN = 'CZ65 0800 0000 1920 0014 5399';
      expect(SPAYDGenerator.isValidIBAN(validIBAN)).toBe(true);
    });

    it('should invalidate incorrect IBAN format', () => {
      const invalidIBAN = 'CZ123';
      expect(SPAYDGenerator.isValidIBAN(invalidIBAN)).toBe(false);
    });

    it('should invalidate non-Czech IBAN', () => {
      const nonCzechIBAN = 'DE89370400440532013000';
      expect(SPAYDGenerator.isValidIBAN(nonCzechIBAN)).toBe(false);
    });
  });

  describe('formatCzechAccountToIBAN', () => {
    it('should format Czech account to IBAN', () => {
      const result = SPAYDGenerator.formatCzechAccountToIBAN(
        '2501234567',
        '2010',
        '000000'
      );

      expect(result).toMatch(/^CZ\d{22}$/);
      expect(result).toContain('2010'); // Bank code
      expect(result).toContain('2501234567'); // Account number
    });

    it('should handle account without prefix', () => {
      const result = SPAYDGenerator.formatCzechAccountToIBAN(
        '2501234567',
        '2010'
      );

      expect(result).toMatch(/^CZ\d{22}$/);
    });
  });
});