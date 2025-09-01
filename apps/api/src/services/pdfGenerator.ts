import puppeteer, { Browser } from 'puppeteer';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { InvoicePDFTemplate, InvoicePDFTemplateProps } from '../templates/InvoicePDFTemplate';
import { SPAYDGenerator } from '../utils/spaydGenerator';
import { i18n } from '../utils/i18n';

export interface InvoiceData {
  invoiceNumber: number;
  issueDate: string;
  dueDate: string;
  clientName: string;
  clientAddress: string;
  subtotal: number;
  vatAmount: number;
  total: number;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    vatRate?: number | null;
  }>;
  supplier: {
    name: string;
    address: string;
    ico?: string | null;
    dic?: string | null;
    isNonVatPayer?: boolean;
    bankAccount?: string | null; // For QR code generation
  };
  qrCodeDataUrl?: string;
}

export class PDFGenerator {
  private browser: Browser | null = null;

  async initialize(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
  }

  async generateInvoicePDF(invoiceData: InvoiceData, language: string = 'en'): Promise<Buffer> {
    try {
      // Ensure browser is initialized
      await this.initialize();
      
      if (!this.browser) {
        throw new Error('Failed to initialize browser');
      }

      // Generate QR code if bank account is provided
      let invoiceWithQR = { ...invoiceData };
      if (invoiceData.supplier.bankAccount) {
        try {
          // Use the actual IBAN from user's supplier settings
          const iban = invoiceData.supplier.bankAccount;
          
          // Validate the IBAN before generating QR code
          if (SPAYDGenerator.isValidIBAN(iban)) {
            invoiceWithQR.qrCodeDataUrl = await SPAYDGenerator.generateInvoiceQRCode(
              invoiceData.invoiceNumber,
              invoiceData.total,
              iban,
              invoiceData.clientName,
              invoiceData.supplier.name
            );
          } else {
            console.warn('Invalid IBAN provided for QR code generation:', iban);
          }
        } catch (error) {
          console.error('Error generating QR code:', error);
          // Continue without QR code if generation fails
        }
      }

      // Get translations for the specified language
      const translations = i18n.getTranslations(language);

      // Render the React component to HTML string with translations
      const props: InvoicePDFTemplateProps = { 
        invoice: invoiceWithQR, 
        translations, 
        language 
      };
      
      const htmlContent = ReactDOMServer.renderToStaticMarkup(
        React.createElement(InvoicePDFTemplate, props)
      );

      // Create a new page
      const page = await this.browser.newPage();

      // Set the HTML content
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0',
      });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm',
        },
      });

      // Close the page
      await page.close();

      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Create a singleton instance
export const pdfGenerator = new PDFGenerator();