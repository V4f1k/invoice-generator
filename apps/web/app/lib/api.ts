'use client';

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface AuthResponse {
  message: string;
  user: {
    id: string;
    email: string;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Supplier {
  id: string;
  userId: string;
  name: string;
  street: string;
  city: string;
  zipCode: string;
  country: string;
  ico: string | null;
  dic: string | null;
  bankAccount: string | null;
  isNonVatPayer: boolean;
  registrationType?: string | null;
  registrationCourt?: string | null;
  registrationFileNumber?: string | null;
  automaticLegalText?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierRequest {
  name: string;
  street: string;
  city: string;
  zipCode: string;
  country: string;
  ico?: string;
  dic?: string;
  bankAccount?: string;
  isNonVatPayer?: boolean;
  registrationType?: string;
  registrationCourt?: string;
  registrationFileNumber?: string;
  automaticLegalText?: string;
}

export interface Customer {
  id: string;
  userId: string;
  name: string;
  street: string;
  city: string;
  zipCode: string;
  country: string;
  ico: string | null;
  dic: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerRequest {
  name: string;
  street: string;
  city: string;
  zipCode: string;
  country: string;
  ico?: string;
  dic?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  vatRate: number | null;
}

export interface Invoice {
  id: string;
  invoiceNumber: number;
  supplierId: string;
  clientName: string;
  clientStreet: string;
  clientCity: string;
  clientZipCode: string;
  clientCountry: string;
  issueDate: string;
  dueDate: string;
  duzp?: string | null;
  subtotal: number;
  vatAmount: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  items: InvoiceItem[];
  supplier: Supplier;
}

export interface CreateInvoiceRequest {
  customerId?: string;
  clientName: string;
  clientStreet: string;
  clientCity: string;
  clientZipCode: string;
  clientCountry: string;
  issueDate: string;
  dueDate: string;
  duzp?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate?: number;
  }[];
}

export interface AresAddress {
  street: string;
  city: string;
  zipCode: string;
  country: string;
}

export interface AresRegistration {
  registrationType: string;
  registrationCourt: string | null;
  registrationFileNumber: string | null;
  automaticLegalText: string | null; // The generated legal text for display
  registryCode: string | null; // VR, RZP, RES, etc.
  isBusinessPerson: boolean; // true for OSVČ, false for companies
}

export interface AresResponse {
  ico: string;
  name: string;
  address: AresAddress;
  registration: AresRegistration;
  isActive: boolean;
  dic: string | null;
}

export const authApi = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post('/api/v1/auth/register', data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/api/v1/auth/login', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/api/v1/auth/logout');
  },
};

export const supplierApi = {
  get: async (): Promise<Supplier | null> => {
    const response = await api.get('/api/v1/supplier');
    return response.data;
  },

  update: async (data: SupplierRequest): Promise<Supplier> => {
    const response = await api.put('/api/v1/supplier', data);
    return response.data;
  },
};

export const invoiceApi = {
  create: async (data: CreateInvoiceRequest): Promise<Invoice> => {
    const response = await api.post('/api/v1/invoices', data);
    return response.data;
  },

  get: async (id: string): Promise<Invoice> => {
    const response = await api.get(`/api/v1/invoices/${id}`);
    return response.data;
  },

  list: async (): Promise<Invoice[]> => {
    const response = await api.get('/api/v1/invoices');
    return response.data;
  },

  downloadPdf: async (id: string, language: string = 'en'): Promise<Blob> => {
    const response = await api.get(`/api/v1/invoices/${id}/pdf?lang=${language}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export const aresApi = {
  lookup: async (ico: string): Promise<AresResponse> => {
    const response = await api.get(`/api/v1/ares/${ico}`);
    return response.data;
  },
};

export const customerApi = {
  list: async (): Promise<Customer[]> => {
    const response = await api.get('/api/v1/customers');
    return response.data;
  },

  create: async (data: CustomerRequest): Promise<Customer> => {
    const response = await api.post('/api/v1/customers', data);
    return response.data;
  },

  update: async (id: string, data: CustomerRequest): Promise<Customer> => {
    const response = await api.put(`/api/v1/customers/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/customers/${id}`);
  },
};