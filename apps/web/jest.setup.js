import '@testing-library/jest-dom';

// Fully mock next-intl (avoid importing ESM module in Jest)
jest.mock('next-intl', () => {
  // Translation mapping for tests
  const translations = {
    'invoice.createNewInvoice': 'Create New Invoice',
    'invoice.clientInformation': 'Client Information',
    'invoice.clientName': 'Client Name',
    'invoice.clientAddress': 'Client Address',
    'invoice.invoiceDates': 'Invoice Dates',
    'invoice.issueDate': 'Issue Date',
    'invoice.dueDate': 'Due Date',
    'invoice.lineItems': 'Line Items',
    'invoice.addItem': 'Add Item',
    'invoice.item': 'Item',
    'invoice.description': 'Description',
    'invoice.quantity': 'Quantity',
    'invoice.unitPrice': 'Unit Price',
    'invoice.vatRate': 'VAT Rate',
    'invoice.lineTotal': 'Line Total',
    'invoice.subtotal': 'Subtotal',
    'invoice.vatAmount': 'VAT Amount',
    'invoice.total': 'Total',
    'invoice.createInvoice': 'Create Invoice',
    'invoice.creating': 'Creating...',
    'actions.cancel': 'Cancel',
    'actions.save': 'Save',
    'actions.saveSettings': 'Save Settings',
    'common.required': 'required',
    'errors.clientNameRequired': 'Client name is required',
    'errors.clientAddressRequired': 'Client address is required',
    'errors.descriptionRequired': 'Description is required',
  };

  return {
    // Simple passthrough provider
    NextIntlClientProvider: ({ children }) => children,
    useTranslations: (namespace = '') => (key) => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      return translations[fullKey] || fullKey;
    },
    useLocale: () => 'en',
    useFormatter: () => ({
      dateTime: (date) => new Date(date).toLocaleDateString(),
      number: (num, opts) => (opts?.style === 'currency' ? `$${num}` : String(num)),
    }),
  };
});

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock navigation APIs that jsdom doesn't implement
try {
  Object.defineProperty(window, 'location', {
    value: {
      ...window.location,
      assign: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
    },
    writable: true,
  });
} catch {}

// Shim ResizeObserver used by Radix UI
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-expect-error ResizeObserver is not defined in test environment
global.ResizeObserver = global.ResizeObserver || MockResizeObserver;

// Mock the locale provider
jest.mock('@/app/lib/locale-provider', () => ({
  useLocale: () => ({
    locale: 'en'
  })
}));

// Mock the API module
jest.mock('@/app/lib/api', () => ({
  invoiceApi: {
    create: jest.fn().mockResolvedValue({
      id: 'test-id',
      invoiceNumber: 1,
      issueDate: '2024-01-15',
      dueDate: '2024-01-29'
    }),
    list: jest.fn().mockResolvedValue([]),
  },
  customerApi: {
    list: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({ id: 'test-customer-id' }),
  },
  supplierApi: {
    get: jest.fn().mockResolvedValue({
      id: '1',
      name: 'Test Supplier',
      isNonVatPayer: false,
      address: 'Test Address',
      ico: '12345678',
      dic: 'CZ12345678',
      bankAccount: 'CZ6508000000192000145399',
    }),
  },
  aresApi: {
    lookup: jest.fn().mockResolvedValue({
      name: 'ARES Client',
      address: {
        street: 'Street',
        city: 'City',
        zipCode: '00000',
        country: 'Czech Republic'
      }
    }),
  },
}));

