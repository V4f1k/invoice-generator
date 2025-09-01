import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { InvoiceCreationModal } from '../InvoiceCreationModal';
import { invoiceApi, supplierApi } from '../../../lib/api';
import { NextIntlProvider } from 'next-intl';
import { LocaleProvider } from '../../../lib/locale-provider';

// Mock the APIs
jest.mock('../../../lib/api');
const mockInvoiceApi = invoiceApi as jest.Mocked<typeof invoiceApi>;
const mockSupplierApi = supplierApi as jest.Mocked<typeof supplierApi>;

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock useForm
jest.mock('react-hook-form');
const mockUseForm = useForm as jest.MockedFunction<typeof useForm>;

// Mock translations
const messages = {
  invoice: {
    createNewInvoice: 'Create New Invoice',
    clientInformation: 'Client Information',
    clientName: 'Client Name',
    clientAddress: 'Client Address',
    invoiceDates: 'Invoice Dates',
    issueDate: 'Issue Date',
    dueDate: 'Due Date',
    lineItems: 'Line Items',
    addItem: 'Add Item',
    item: 'Item',
    description: 'Description',
    quantity: 'Quantity',
    unitPrice: 'Unit Price',
    vatRate: 'VAT Rate',
    lineTotal: 'Line Total',
    subtotal: 'Subtotal',
    vatAmount: 'VAT Amount',
    total: 'Total',
    createInvoice: 'Create Invoice',
    creating: 'Creating...',
    placeholders: {
      clientName: 'Enter client name',
      clientAddress: 'Enter client address',
      description: 'Enter description',
    }
  },
  actions: {
    cancel: 'Cancel'
  }
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <NextIntlProvider locale="en" messages={messages}>
    <LocaleProvider locale="en">
      {children}
    </LocaleProvider>
  </NextIntlProvider>
);

describe('InvoiceCreationModal - Reverse Charge', () => {
  const mockFormMethods = {
    register: jest.fn(),
    handleSubmit: jest.fn(),
    formState: { errors: {} },
    watch: jest.fn(),
    setValue: jest.fn(),
    getValues: jest.fn(),
    reset: jest.fn(),
    control: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock form methods
    mockUseForm.mockReturnValue(mockFormMethods as any);
    
    // Mock supplier API to return VAT payer
    mockSupplierApi.get.mockResolvedValue({
      id: '1',
      name: 'Test Supplier',
      address: 'Test Address',
      ico: '12345678',
      dic: 'CZ12345678',
      isNonVatPayer: false,
      bankAccount: 'CZ6508000000192000145399',
    });
    
    // Mock successful invoice creation
    mockInvoiceApi.create.mockResolvedValue({
      id: '1',
      invoiceNumber: '2508310001',
      clientName: 'Test Client',
      clientAddress: 'Test Address',
      issueDate: '2025-08-31',
      dueDate: '2025-09-14',
      isReverseCharge: false,
      subtotal: 1000,
      vatAmount: 210,
      total: 1210,
      items: [],
    });
  });

  it('should show reverse charge checkbox for VAT payers', async () => {
    mockFormMethods.watch.mockImplementation((field) => {
      if (field === 'items') return [{ description: 'Test', quantity: 1, unitPrice: 1000, vatRate: 21 }];
      if (field === 'issueDate') return '2025-08-31';
      if (field === 'isReverseCharge') return false;
      return '';
    });

    render(
      <TestWrapper>
        <InvoiceCreationModal isOpen={true} onClose={jest.fn()} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Přenesená daňová povinnost (Reverse Charge)')).toBeInTheDocument();
    });
  });

  it('should not show reverse charge checkbox for non-VAT payers', async () => {
    // Mock supplier as non-VAT payer
    mockSupplierApi.get.mockResolvedValue({
      id: '1',
      name: 'Test Supplier',
      address: 'Test Address',
      ico: '12345678',
      dic: null,
      isNonVatPayer: true,
      bankAccount: 'CZ6508000000192000145399',
    });

    mockFormMethods.watch.mockImplementation((field) => {
      if (field === 'items') return [{ description: 'Test', quantity: 1, unitPrice: 1000, vatRate: 0 }];
      if (field === 'issueDate') return '2025-08-31';
      if (field === 'isReverseCharge') return false;
      return '';
    });

    render(
      <TestWrapper>
        <InvoiceCreationModal isOpen={true} onClose={jest.fn()} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByText('Přenesená daňová povinnost (Reverse Charge)')).not.toBeInTheDocument();
    });
  });

  it('should hide VAT fields when reverse charge is enabled', async () => {
    mockFormMethods.watch.mockImplementation((field) => {
      if (field === 'items') return [{ description: 'Test', quantity: 1, unitPrice: 1000, vatRate: 0 }];
      if (field === 'issueDate') return '2025-08-31';
      if (field === 'isReverseCharge') return true; // Reverse charge enabled
      return '';
    });

    render(
      <TestWrapper>
        <InvoiceCreationModal isOpen={true} onClose={jest.fn()} />
      </TestWrapper>
    );

    await waitFor(() => {
      // VAT Rate column should be hidden
      expect(screen.queryByText('VAT Rate')).not.toBeInTheDocument();
      
      // VAT Amount should be hidden in totals
      expect(screen.queryByText('VAT Amount:')).not.toBeInTheDocument();
      
      // Should show reverse charge text
      expect(screen.getByText('Daň odvede zákazník')).toBeInTheDocument();
    });
  });

  it('should show VAT fields when reverse charge is disabled', async () => {
    mockFormMethods.watch.mockImplementation((field) => {
      if (field === 'items') return [{ description: 'Test', quantity: 1, unitPrice: 1000, vatRate: 21 }];
      if (field === 'issueDate') return '2025-08-31';
      if (field === 'isReverseCharge') return false; // Reverse charge disabled
      return '';
    });

    render(
      <TestWrapper>
        <InvoiceCreationModal isOpen={true} onClose={jest.fn()} />
      </TestWrapper>
    );

    await waitFor(() => {
      // VAT Rate should be shown
      expect(screen.getByText('VAT Rate')).toBeInTheDocument();
      
      // VAT Amount should be shown in totals
      expect(screen.getByText('VAT Amount:')).toBeInTheDocument();
      
      // Should not show reverse charge text
      expect(screen.queryByText('Daň odvede zákazník')).not.toBeInTheDocument();
    });
  });

  it('should send isReverseCharge flag when creating invoice', async () => {
    const mockHandleSubmit = jest.fn((callback) => callback);
    mockFormMethods.handleSubmit.mockImplementation(mockHandleSubmit);
    
    mockFormMethods.watch.mockImplementation((field) => {
      if (field === 'items') return [{ description: 'Test', quantity: 1, unitPrice: 1000, vatRate: 21 }];
      if (field === 'issueDate') return '2025-08-31';
      if (field === 'isReverseCharge') return true;
      return '';
    });

    render(
      <TestWrapper>
        <InvoiceCreationModal isOpen={true} onClose={jest.fn()} />
      </TestWrapper>
    );

    const createButton = screen.getByText('Create Invoice');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockInvoiceApi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isReverseCharge: true,
          items: expect.arrayContaining([
            expect.objectContaining({
              vatRate: 0, // VAT rate should be 0 for reverse charge
            }),
          ]),
        })
      );
    });
  });

  it('should reset VAT rates to 0 when enabling reverse charge', async () => {
    let reverseChargeState = false;
    
    mockFormMethods.watch.mockImplementation((field) => {
      if (field === 'items') return [{ description: 'Test', quantity: 1, unitPrice: 1000, vatRate: 21 }];
      if (field === 'issueDate') return '2025-08-31';
      if (field === 'isReverseCharge') return reverseChargeState;
      return '';
    });

    render(
      <TestWrapper>
        <InvoiceCreationModal isOpen={true} onClose={jest.fn()} />
      </TestWrapper>
    );

    const checkbox = screen.getByRole('checkbox');
    
    // Simulate checking the reverse charge checkbox
    fireEvent.click(checkbox);
    
    await waitFor(() => {
      // Should call setValue to enable reverse charge
      expect(mockFormMethods.setValue).toHaveBeenCalledWith('isReverseCharge', true);
      
      // Should reset item VAT rates to 0
      expect(mockFormMethods.setValue).toHaveBeenCalledWith(
        'items',
        expect.arrayContaining([
          expect.objectContaining({
            vatRate: 0,
          }),
        ])
      );
    });
  });
});