import express, { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { Prisma } from '@prisma/client';
import { pdfGenerator } from '../services/pdfGenerator';

const router = express.Router();

// Invoice validation schemas
const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unitPrice: z.number().min(0.01, 'Unit price must be greater than 0'),
  vatRate: z.number().min(0).max(100).optional(),
});

const createInvoiceSchema = z.object({
  customerId: z.string().uuid().optional(),
  clientName: z.string().min(1, 'Client name is required'),
  clientStreet: z.string().min(1, 'Client street is required'),
  clientCity: z.string().min(1, 'Client city is required'),
  clientZipCode: z.string().min(1, 'Client zip code is required'),
  clientCountry: z.string().min(1, 'Client country is required').default('Czech Republic'),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  duzp: z.string().optional(),
  description: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  isReverseCharge: z.boolean().optional().default(false),
});

// Helper function to generate unique invoice number in format YYMMDDXXXX within transaction
async function generateInvoiceNumber(
  supplierId: string, 
  tx: Prisma.TransactionClient
): Promise<bigint> {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // YY
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // MM
  const day = now.getDate().toString().padStart(2, '0'); // DD
  const datePrefix = `${year}${month}${day}`; // YYMMDD
  
  // Find the latest invoice for this supplier created today
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  
  const lastInvoice = await tx.invoice.findFirst({
    where: { 
      supplierId,
      createdAt: {
        gte: startOfDay,
        lt: endOfDay
      }
    },
    orderBy: { invoiceNumber: 'desc' },
    select: { invoiceNumber: true }
  });
  
  let sequence = 1; // Default sequence for first invoice of the day
  
  if (lastInvoice) {
    // Extract the sequence part (last 4 digits) and increment
    const lastSequence = Number(lastInvoice.invoiceNumber) % 10000;
    sequence = lastSequence + 1;
  }
  
  // Format: YYMMDD + XXXX (4-digit sequence)
  const invoiceNumber = BigInt(datePrefix + sequence.toString().padStart(4, '0'));
  
  return invoiceNumber;
}

// POST /api/v1/invoices - Create new invoice
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = createInvoiceSchema.parse(req.body);
    const userId = req.userId!;

    // Get user's supplier info
    const supplier = await prisma.supplier.findUnique({
      where: { userId }
    });

    if (!supplier) {
      res.status(400).json({ 
        error: 'Supplier profile not found. Please complete your profile first.' 
      });
      return;
    }

    // If customerId is provided, verify it belongs to the user
    if (validatedData.customerId) {
      const customer = await prisma.customer.findFirst({
        where: {
          id: validatedData.customerId,
          userId: userId
        }
      });

      if (!customer) {
        res.status(400).json({ 
          error: 'Customer not found or does not belong to the current user.' 
        });
        return;
      }
    }

    // Retry mechanism for race conditions with invoice number generation
    let result: any;
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts) {
      try {
        // Use transaction for atomic operation
        result = await prisma.$transaction(async (tx) => {
          // Generate sequential invoice number within transaction
          const invoiceNumber = await generateInvoiceNumber(supplier.id, tx);

          // Calculate totals with VAT (ignore VAT if reverse charge)
      const subtotal = validatedData.items.reduce(
        (sum, item) => sum + (item.quantity * item.unitPrice),
        0
      );
      
      const vatAmount = validatedData.isReverseCharge ? 0 : validatedData.items.reduce(
        (sum, item) => {
          const lineTotal = item.quantity * item.unitPrice;
          const vatRate = item.vatRate || 0;
          return sum + (lineTotal * vatRate / 100);
        },
        0
      );
      
      const total = subtotal + vatAmount;

      // Create invoice
      const invoice = await tx.invoice.create({
        data: {
          supplierId: supplier.id,
          customerId: validatedData.customerId || null,
          invoiceNumber,
          clientName: validatedData.clientName,
          clientStreet: validatedData.clientStreet,
          clientCity: validatedData.clientCity,
          clientZipCode: validatedData.clientZipCode,
          clientCountry: validatedData.clientCountry,
          issueDate: new Date(validatedData.issueDate),
          dueDate: new Date(validatedData.dueDate),
          duzp: validatedData.duzp ? new Date(validatedData.duzp) : null,
          description: validatedData.description || null,
          subtotal,
          vatAmount,
          total,
          isReverseCharge: validatedData.isReverseCharge,
          items: {
            create: validatedData.items.map(item => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.quantity * item.unitPrice,
              vatRate: validatedData.isReverseCharge ? null : (item.vatRate || null)
            }))
          }
        },
        include: {
          items: true,
          supplier: true,
          customer: true
        }
      });

          return invoice;
        });
        
        break; // Success, exit retry loop
        
      } catch (error: any) {
        attempts++;
        if (error.code === 'P2002' && attempts < maxAttempts) {
          // Race condition detected, retry with a small delay
          await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
          continue;
        }
        throw error;
      }
    }
    
    if (attempts >= maxAttempts) {
      throw new Error('Failed to create invoice after multiple attempts due to race conditions');
    }

    // Convert BigInt to string for JSON serialization
    const response = {
      ...result,
      invoiceNumber: result.invoiceNumber.toString()
    };
    
    res.status(201).json(response);

  } catch (error) {
    console.error('Error creating invoice:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'Validation failed', 
        details: error.issues 
      });
      return;
    }

    res.status(500).json({ 
      error: 'Failed to create invoice' 
    });
  }
});

// GET /api/v1/invoices/:id - Get invoice by ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    // Get user's supplier info first
    const supplier = await prisma.supplier.findUnique({
      where: { userId }
    });

    if (!supplier) {
      res.status(400).json({ 
        error: 'Supplier profile not found' 
      });
      return;
    }

    // Find invoice that belongs to this supplier
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        supplierId: supplier.id
      },
      include: {
        items: true,
        supplier: true,
        customer: true
      }
    });

    if (!invoice) {
      res.status(404).json({ 
        error: 'Invoice not found or access denied' 
      });
      return;
    }

    // Convert BigInt to string for JSON serialization
    const response = {
      ...invoice,
      invoiceNumber: invoice.invoiceNumber.toString()
    };
    
    res.json(response);

  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ 
      error: 'Failed to fetch invoice' 
    });
  }
});

// GET /api/v1/invoices - List all invoices for current supplier
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    // Get user's supplier info first
    const supplier = await prisma.supplier.findUnique({
      where: { userId }
    });

    if (!supplier) {
      res.status(400).json({ 
        error: 'Supplier profile not found' 
      });
      return;
    }

    // Find all invoices for this supplier
    const invoices = await prisma.invoice.findMany({
      where: {
        supplierId: supplier.id
      },
      include: {
        items: true,
        supplier: true,
        customer: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Convert BigInt to string for JSON serialization
    const response = invoices.map(invoice => ({
      ...invoice,
      invoiceNumber: invoice.invoiceNumber.toString()
    }));
    
    res.json(response);

  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ 
      error: 'Failed to fetch invoices' 
    });
  }
});

// GET /api/v1/invoices/:id/pdf - Download invoice as PDF
router.get('/:id/pdf', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { lang = 'en' } = req.query; // Get language from query parameter, default to English
    const userId = req.userId!;

    // Get user's supplier info first
    const supplier = await prisma.supplier.findUnique({
      where: { userId }
    });

    if (!supplier) {
      res.status(400).json({ 
        error: 'Supplier profile not found' 
      });
      return;
    }

    // Find invoice that belongs to this supplier
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        supplierId: supplier.id
      },
      include: {
        items: true,
        supplier: true,
        customer: true
      }
    });

    if (!invoice) {
      res.status(404).json({ 
        error: 'Invoice not found or access denied' 
      });
      return;
    }

    // Import the registration text generator
    const { generateRegistrationText } = await import('../routes/supplier');
    
    // Prepare invoice data for PDF generation
    const invoiceData = {
      invoiceNumber: Number(invoice.invoiceNumber),
      issueDate: invoice.issueDate.toISOString(),
      dueDate: invoice.dueDate.toISOString(),
      duzp: invoice.duzp ? invoice.duzp.toISOString() : null,
      description: invoice.description,
      clientName: invoice.clientName,
      clientStreet: invoice.clientStreet,
      clientCity: invoice.clientCity,
      clientZipCode: invoice.clientZipCode,
      clientCountry: invoice.clientCountry,
      clientIco: invoice.customer?.ico || null,
      clientDic: invoice.customer?.dic || null,
      clientAddress: `${invoice.clientStreet}\n${invoice.clientZipCode} ${invoice.clientCity}\n${invoice.clientCountry}`, // Composed for backward compatibility
      subtotal: invoice.subtotal.toNumber(),
      vatAmount: invoice.vatAmount.toNumber(),
      total: invoice.total.toNumber(),
      isReverseCharge: invoice.isReverseCharge,
      items: invoice.items.map(item => ({
        description: item.description,
        quantity: item.quantity.toNumber(),
        unitPrice: item.unitPrice.toNumber(),
        lineTotal: item.lineTotal.toNumber(),
        vatRate: item.vatRate ? item.vatRate.toNumber() : null
      })),
      supplier: {
        name: invoice.supplier.name,
        street: invoice.supplier.street,
        city: invoice.supplier.city,
        zipCode: invoice.supplier.zipCode,
        country: invoice.supplier.country,
        address: `${invoice.supplier.street}\n${invoice.supplier.zipCode} ${invoice.supplier.city}\n${invoice.supplier.country}`, // Composed for backward compatibility
        ico: invoice.supplier.ico,
        dic: invoice.supplier.dic,
        isNonVatPayer: invoice.supplier.isNonVatPayer,
        bankAccount: invoice.supplier.bankAccount,
        registrationType: invoice.supplier.registrationType,
        registrationCourt: invoice.supplier.registrationCourt,
        registrationFileNumber: invoice.supplier.registrationFileNumber,
        registrationText: generateRegistrationText(invoice.supplier)
      }
    };

    // Generate PDF with language support
    const pdfBuffer = await pdfGenerator.generateInvoicePDF(invoiceData, lang as string);

    // Set response headers for PDF download
    const filename = `faktura-${invoice.invoiceNumber.toString().padStart(10, '0')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length.toString());

    // Send PDF buffer
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF' 
    });
  }
});

export default router;