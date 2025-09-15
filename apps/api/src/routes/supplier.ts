import express, { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { z } from 'zod';

const router = express.Router();

// Helper function to generate registration text
export function generateRegistrationText(supplier: {
  registrationType?: string | null;
  registrationCourt?: string | null;
  registrationFileNumber?: string | null;
}): string | null {
  const { registrationType, registrationCourt, registrationFileNumber } = supplier;
  
  if (!registrationType) return null;
  
  switch (registrationType) {
    case 'obchodni_rejstrik':
      if (registrationCourt && registrationFileNumber) {
        return `Společnost je zapsána v obchodním rejstříku vedeném ${registrationCourt}, oddíl ${registrationFileNumber}`;
      }
      break;
    case 'zivnostensky_rejstrik':
      return `Fyzická osoba zapsaná v živnostenském rejstříku`;
    case 'jiny_rejstrik':
      if (registrationCourt && registrationFileNumber) {
        return `Zápis v rejstříku: ${registrationCourt}, ${registrationFileNumber}`;
      }
      break;
    case 'bez_zapisu':
      return 'Není zapsán v obchodním rejstříku';
  }
  
  return null;
}

// Validation schema for supplier data
const supplierSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  zipCode: z.string().min(1, 'Zip code is required'),
  country: z.string().min(1, 'Country is required').default('Czech Republic'),
  ico: z.string().optional(),
  dic: z.string().optional(),
  bankAccount: z.string().optional(),
  isNonVatPayer: z.boolean().optional().default(false),
  registrationType: z.string().optional(),
  registrationCourt: z.string().optional(),
  registrationFileNumber: z.string().optional(),
  automaticLegalText: z.string().optional(),
});

// GET /api/v1/supplier - Get current user's supplier info
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    const supplier = await prisma.supplier.findUnique({
      where: { userId },
    });

    // Return null if no supplier exists yet (new user)
    res.json(supplier || null);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/v1/supplier - Create or update supplier info
router.put('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    
    console.log('PUT /supplier - userId from request:', userId);
    
    if (!userId) {
      res.status(401).json({ error: 'User ID not found' });
      return;
    }
    
    // Check if user exists in database
    const userExists = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    console.log('User exists check:', userExists ? 'YES' : 'NO');
    
    if (!userExists) {
      res.status(400).json({ error: 'User not found in database' });
      return;
    }
    
    // Validate request body
    const result = supplierSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: result.error.issues,
      });
      return;
    }

    const { 
      name, 
      street, 
      city, 
      zipCode, 
      country, 
      ico, 
      dic, 
      bankAccount, 
      isNonVatPayer,
      registrationType,
      registrationCourt,
      registrationFileNumber,
      automaticLegalText
    } = result.data;

    // Use upsert to handle both create and update
    const supplier = await prisma.supplier.upsert({
      where: { userId },
      update: {
        name,
        street,
        city,
        zipCode,
        country,
        ico: ico || null,
        dic: dic || null,
        bankAccount: bankAccount || null,
        isNonVatPayer: isNonVatPayer || false,
        registrationType: registrationType || null,
        registrationCourt: registrationCourt || null,
        registrationFileNumber: registrationFileNumber || null,
        automaticLegalText: automaticLegalText || null,
      },
      create: {
        userId,
        name,
        street,
        city,
        zipCode,
        country,
        ico: ico || null,
        dic: dic || null,
        bankAccount: bankAccount || null,
        isNonVatPayer: isNonVatPayer || false,
        registrationType: registrationType || null,
        registrationCourt: registrationCourt || null,
        registrationFileNumber: registrationFileNumber || null,
        automaticLegalText: automaticLegalText || null,
      },
    });

    res.json(supplier);
  } catch (error) {
    console.error('Error saving supplier:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
