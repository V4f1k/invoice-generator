import express, { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { z } from 'zod';

const router = express.Router();

// Validation schema for customer data
const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  zipCode: z.string().min(1, 'Zip code is required'),
  country: z.string().min(1, 'Country is required').default('Czech Republic'),
  ico: z.string().optional(),
  dic: z.string().optional(),
});

// GET /api/v1/customers - List all customers for authenticated user
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      res.status(401).json({ error: 'User ID not found' });
      return;
    }

    const customers = await prisma.customer.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/customers - Create a new customer
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      res.status(401).json({ error: 'User ID not found' });
      return;
    }
    
    // Validate request body
    const result = customerSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: result.error.issues,
      });
      return;
    }

    const { name, street, city, zipCode, country, ico, dic } = result.data;

    const customer = await prisma.customer.create({
      data: {
        userId,
        name,
        street,
        city,
        zipCode,
        country,
        ico: ico || null,
        dic: dic || null,
      },
    });

    res.status(201).json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/v1/customers/:id - Update an existing customer
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const customerId = req.params.id;
    
    if (!userId) {
      res.status(401).json({ error: 'User ID not found' });
      return;
    }
    
    // Validate request body
    const result = customerSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: result.error.issues,
      });
      return;
    }

    // Check if customer exists and belongs to user
    const existingCustomer = await prisma.customer.findFirst({
      where: { id: customerId, userId },
    });

    if (!existingCustomer) {
      res.status(404).json({ error: 'Customer not found or access denied' });
      return;
    }

    const { name, street, city, zipCode, country, ico, dic } = result.data;

    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        name,
        street,
        city,
        zipCode,
        country,
        ico: ico || null,
        dic: dic || null,
      },
    });

    res.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v1/customers/:id - Delete a customer
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const customerId = req.params.id;
    
    if (!userId) {
      res.status(401).json({ error: 'User ID not found' });
      return;
    }

    // Check if customer exists and belongs to user
    const existingCustomer = await prisma.customer.findFirst({
      where: { id: customerId, userId },
    });

    if (!existingCustomer) {
      res.status(404).json({ error: 'Customer not found or access denied' });
      return;
    }

    await prisma.customer.delete({
      where: { id: customerId },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;