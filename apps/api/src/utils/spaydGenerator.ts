import QRCode from 'qrcode';

/**
 * SPAYD (Short Payment Descriptor) is a Czech banking standard for payment QR codes.
 * Format: SPD*1.0*ACC:{IBAN}*AM:{amount}*CC:{currency}*MSG:{message}*X-VS:{variable_symbol}
 */

export interface SPAYDOptions {
  iban: string;              // Bank account IBAN
  amount: number;             // Payment amount
  currency?: string;          // Currency code (default: CZK)
  message?: string;           // Payment message/description
  variableSymbol?: string;    // Variable symbol (invoice number)
  constantSymbol?: string;    // Constant symbol
  specificSymbol?: string;    // Specific symbol
  recipientName?: string;     // Recipient name
}

export class SPAYDGenerator {
  /**
   * Generates a SPAYD payment string according to Czech banking standards
   */
  static generateSPAYDString(options: SPAYDOptions): string {
    const parts: string[] = [
      'SPD',
      '1.0', // SPAYD version
    ];

    // Required fields
    if (!options.iban || !options.amount) {
      throw new Error('IBAN and amount are required for SPAYD generation');
    }

    // Format IBAN (remove spaces and convert to uppercase)
    const formattedIBAN = options.iban.replace(/\s/g, '').toUpperCase();
    parts.push(`ACC:${formattedIBAN}`);

    // Amount (format with 2 decimal places)
    parts.push(`AM:${options.amount.toFixed(2)}`);

    // Currency (default to CZK)
    parts.push(`CC:${options.currency || 'CZK'}`);

    // Optional fields
    if (options.message) {
      // Limit message to 60 characters as per SPAYD specification
      const message = options.message.substring(0, 60);
      parts.push(`MSG:${message}`);
    }

    if (options.variableSymbol) {
      parts.push(`X-VS:${options.variableSymbol}`);
    }

    if (options.constantSymbol) {
      parts.push(`X-KS:${options.constantSymbol}`);
    }

    if (options.specificSymbol) {
      parts.push(`X-SS:${options.specificSymbol}`);
    }

    if (options.recipientName) {
      // Limit recipient name to 35 characters
      const name = options.recipientName.substring(0, 35);
      parts.push(`RN:${name}`);
    }

    return parts.join('*');
  }

  /**
   * Generates a QR code as a base64 data URL from SPAYD payment data
   */
  static async generateQRCode(options: SPAYDOptions): Promise<string> {
    try {
      const spaydString = this.generateSPAYDString(options);
      
      // Generate QR code with Czech banking app compatible settings
      const qrCodeDataUrl = await QRCode.toDataURL(spaydString, {
        errorCorrectionLevel: 'M', // Medium error correction
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        width: 256, // Standard size for banking apps
      });

      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Generates QR code for an invoice
   */
  static async generateInvoiceQRCode(
    invoiceNumber: number,
    amount: number,
    iban: string,
    clientName: string,
    supplierName?: string
  ): Promise<string> {
    // Use client's name as message for recipient as per Story 1.6 requirements
    const message = clientName;
    
    return this.generateQRCode({
      iban,
      amount,
      currency: 'CZK',
      message,
      variableSymbol: String(invoiceNumber), // Use YYMMDDXXXXX format as variable symbol
      recipientName: supplierName,
    });
  }

  /**
   * Validates IBAN format (basic validation)
   */
  static isValidIBAN(iban: string): boolean {
    // Remove spaces and convert to uppercase
    const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();
    
    // Check if it matches basic IBAN pattern
    // CZ IBAN format: CZ + 2 check digits + 20 digits
    const czIBANRegex = /^CZ\d{22}$/;
    
    return czIBANRegex.test(cleanIBAN);
  }

  /**
   * Formats Czech bank account to IBAN format
   * Czech account format: prefix-account_number/bank_code
   */
  static formatCzechAccountToIBAN(
    accountNumber: string,
    bankCode: string,
    prefix?: string
  ): string {
    // This is a simplified conversion - in production, use a proper IBAN library
    // Czech IBAN structure: CZ + check digits + bank code (4 digits) + prefix (6 digits) + account (10 digits)
    
    const paddedBankCode = bankCode.padStart(4, '0');
    const paddedPrefix = (prefix || '0').padStart(6, '0');
    const paddedAccount = accountNumber.padStart(10, '0');
    
    // For demo purposes, using placeholder check digits
    // In production, calculate proper IBAN check digits
    const checkDigits = '65'; // Placeholder
    
    return `CZ${checkDigits}${paddedBankCode}${paddedPrefix}${paddedAccount}`;
  }
}

export default SPAYDGenerator;