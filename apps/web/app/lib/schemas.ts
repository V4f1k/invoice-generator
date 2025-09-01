import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const supplierSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  zipCode: z.string().min(1, 'Zip code is required'),
  country: z.string().min(1, 'Country is required').default('Czech Republic'),
  ico: z.string().optional(),
  dic: z.string().optional(),
  bankAccount: z.string().optional(),
  isNonVatPayer: z.boolean(),
  registrationType: z.string().optional(),
  registrationCourt: z.string().optional(),
  registrationFileNumber: z.string().optional(),
  automaticLegalText: z.string().optional(),
});

export const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  zipCode: z.string().min(1, 'Zip code is required'),
  country: z.string().min(1, 'Country is required').default('Czech Republic'),
  ico: z.string().optional(),
  dic: z.string().optional(),
});

export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unitPrice: z.number().min(0, 'Unit price must be 0 or greater'),
  vatRate: z.number().min(0).max(100).optional(),
});

export const invoiceSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  clientStreet: z.string().min(1, 'Client street is required'),
  clientCity: z.string().min(1, 'Client city is required'),
  clientZipCode: z.string().min(1, 'Client zip code is required'),
  clientCountry: z.string().min(1, 'Client country is required').default('Czech Republic'),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type SupplierFormData = z.infer<typeof supplierSchema>;
export type CustomerFormData = z.infer<typeof customerSchema>;
export type InvoiceItemFormData = z.infer<typeof invoiceItemSchema>;
export type InvoiceFormData = z.infer<typeof invoiceSchema>;