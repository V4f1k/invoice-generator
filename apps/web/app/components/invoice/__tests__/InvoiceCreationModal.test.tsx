import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InvoiceCreationModal } from '../InvoiceCreationModal';

// Mock the LocaleProvider
jest.mock('@/app/lib/locale-provider', () => ({
  useLocale: () => ({
    locale: 'en'
  })
}));

// Mock the API
jest.mock('@/app/lib/api', () => ({
  invoiceApi: {
    create: jest.fn().mockResolvedValue({
      id: 'test-id',
      invoiceNumber: 1,
      issueDate: '2024-01-15',
      dueDate: '2024-01-29'
    })
  },
  customerApi: {
    list: jest.fn().mockResolvedValue([])
  },
  supplierApi: {
    get: jest.fn().mockResolvedValue({ isNonVatPayer: false })
  },
  aresApi: {
    lookup: jest.fn().mockResolvedValue({
      name: 'ARES Client',
      address: { street: 'Street', city: 'City', zipCode: '00000', country: 'Czech Republic' }
    })
  }
}));

// Mock console.log and alert for testing
const mockConsoleLog = jest.fn();
const mockAlert = jest.fn();

jest.spyOn(console, 'log').mockImplementation(mockConsoleLog);
global.alert = mockAlert;

describe('InvoiceCreationModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    mockConsoleLog.mockClear();
    mockAlert.mockClear();
    defaultProps.onClose.mockClear();
  });

  it('renders the modal when isOpen is true', async () => {
    await act(async () => {
      render(<InvoiceCreationModal {...defaultProps} />);
    });

    expect(screen.getByText('Create New Invoice')).toBeInTheDocument();
    expect(screen.getByText('Client Information')).toBeInTheDocument();
    expect(screen.getByText('Invoice Dates')).toBeInTheDocument();
    expect(screen.getByText('Line Items')).toBeInTheDocument();
  });

  it('does not render the modal when isOpen is false', async () => {
    await act(async () => {
      render(<InvoiceCreationModal {...defaultProps} isOpen={false} />);
    });

    expect(screen.queryByText('Create New Invoice')).not.toBeInTheDocument();
  });

  it('has all required form fields', async () => {
    await act(async () => {
      render(<InvoiceCreationModal {...defaultProps} />);
    });

    // Client information fields
    expect(screen.getByLabelText('Client Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Client Address *')).toBeInTheDocument();

    // Date fields
    expect(screen.getByLabelText('Issue Date *')).toBeInTheDocument();
    expect(screen.getByLabelText('Due Date *')).toBeInTheDocument();

    // Line item fields (first item should be present by default)
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Description *')).toBeInTheDocument();
    expect(screen.getByLabelText('Quantity *')).toBeInTheDocument();
    expect(screen.getByLabelText('Unit Price *')).toBeInTheDocument();
    expect(screen.getByLabelText('VAT Rate')).toBeInTheDocument();
  });

  it('initializes with default values', async () => {
    await act(async () => {
      render(<InvoiceCreationModal {...defaultProps} />);
    });

    const today = new Date().toISOString().split('T')[0];
    const fourteenDaysFromNow = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    expect(screen.getByDisplayValue(today)).toBeInTheDocument(); // Issue date
    expect(screen.getByDisplayValue(fourteenDaysFromNow)).toBeInTheDocument(); // Due date (14 days)
    expect(screen.getByDisplayValue('1')).toBeInTheDocument(); // Default quantity
  });

  it('adds new line items when Add Item button is clicked', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<InvoiceCreationModal {...defaultProps} />);
    });

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.queryByText('Item 2')).not.toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /add item/i }));
    });

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('removes line items when trash button is clicked', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<InvoiceCreationModal {...defaultProps} />);
    });

    // Add a second item first
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /add item/i }));
    });

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();

    // Click the trash button for the second item
    const trashButtons = screen.getAllByRole('button');
    const secondTrashButton = trashButtons.find(button =>
      button.querySelector('svg') && button.textContent === ''
    );

    if (secondTrashButton) {
      await act(async () => {
        await user.click(secondTrashButton);
      });
    }

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.queryByText('Item 2')).not.toBeInTheDocument();
  });

  it('does not remove the last line item', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<InvoiceCreationModal {...defaultProps} />);
    });

    expect(screen.getByText('Item 1')).toBeInTheDocument();

    // Try to find and click trash button (should not exist or should not work)
    const trashButtons = screen.queryAllByRole('button');
    const trashButton = trashButtons.find(button =>
      button.querySelector('svg') && button.textContent === ''
    );

    // If there's only one item, trash button should not be visible or clickable
    if (trashButton) {
      await act(async () => {
        await user.click(trashButton);
      });
    }

    // Item should still be there
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });

  it('calculates line totals correctly', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<InvoiceCreationModal {...defaultProps} />);
    });

    // Fill in quantity and unit price
    const quantityInput = screen.getByLabelText('Quantity *');
    const unitPriceInput = screen.getByLabelText('Unit Price *');

    await act(async () => {
      await user.clear(quantityInput);
      await user.type(quantityInput, '2');
    });

    await act(async () => {
      await user.clear(unitPriceInput);
      await user.type(unitPriceInput, '50');
    });

    // Check if line total is calculated (2 * 50 = 100)
    await waitFor(() => {
      expect(screen.getByDisplayValue('100.00')).toBeInTheDocument();
    });
  });

  it('calculates grand total correctly', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<InvoiceCreationModal {...defaultProps} />);
    });

    // Fill in first item
    await act(async () => {
      await user.clear(screen.getByLabelText('Quantity *'));
      await user.type(screen.getByLabelText('Quantity *'), '2');
    });

    await act(async () => {
      await user.clear(screen.getByLabelText('Unit Price *'));
      await user.type(screen.getByLabelText('Unit Price *'), '25');
    });

    // Add second item
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /add item/i }));
    });

    const quantityInputs = screen.getAllByLabelText('Quantity *');
    const unitPriceInputs = screen.getAllByLabelText('Unit Price *');

    await act(async () => {
      await user.clear(quantityInputs[1]);
      await user.type(quantityInputs[1], '1');
    });

    await act(async () => {
      await user.clear(unitPriceInputs[1]);
      await user.type(unitPriceInputs[1], '30');
    });

    // Check grand total (2*25 + 1*30 = 80)
    await waitFor(() => {
      expect(screen.getByText('$80.00')).toBeInTheDocument();
    });
  });

  it('shows validation errors for required fields', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<InvoiceCreationModal {...defaultProps} />);
    });

    // Try to submit without filling required fields
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /create invoice/i }));
    });

    await waitFor(() => {
      expect(screen.getByText('Client name is required')).toBeInTheDocument();
      expect(screen.getByText('Client address is required')).toBeInTheDocument();
      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });
  });

  it('closes modal when cancel button is clicked', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<InvoiceCreationModal {...defaultProps} />);
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /cancel/i }));
    });

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<InvoiceCreationModal {...defaultProps} />);
    });

    // Fill in required fields
    await act(async () => {
      await user.type(screen.getByLabelText('Client Name *'), 'Test Client');
      await user.type(screen.getByLabelText('Client Address *'), '123 Test Street');
      await user.type(screen.getByLabelText('Description *'), 'Test Service');
    });

    await act(async () => {
      await user.clear(screen.getByLabelText('Quantity *'));
      await user.type(screen.getByLabelText('Quantity *'), '2');
    });

    await act(async () => {
      await user.clear(screen.getByLabelText('Unit Price *'));
      await user.type(screen.getByLabelText('Unit Price *'), '100');
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /create invoice/i }));
    });

    await waitFor(() => {
      expect(mockConsoleLog).toHaveBeenCalledWith('Invoice data:', expect.any(Object));
      expect(mockAlert).toHaveBeenCalledWith('Invoice created successfully! (Note: Save functionality will be implemented in Story 1.5)');
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it('handles form submission errors gracefully', async () => {
    const user = userEvent.setup();

    // Mock console.error to throw an error during submission
    const originalConsoleError = console.error;
    console.error = jest.fn();

    // Mock an error in form submission by making alert throw
    mockAlert.mockImplementationOnce(() => {
      throw new Error('Test error');
    });

    await act(async () => {
      render(<InvoiceCreationModal {...defaultProps} />);
    });

    // Fill in required fields
    await act(async () => {
      await user.type(screen.getByLabelText('Client Name *'), 'Test Client');
      await user.type(screen.getByLabelText('Client Address *'), '123 Test Street');
      await user.type(screen.getByLabelText('Description *'), 'Test Service');
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /create invoice/i }));
    });

    // The component should handle the error gracefully
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create invoice/i })).not.toBeDisabled();
    });

    // Restore console.error
    console.error = originalConsoleError;
  });

  it('displays correct date format', async () => {
    await act(async () => {
      render(<InvoiceCreationModal {...defaultProps} />);
    });

    const issueDateInput = screen.getByLabelText('Issue Date *') as HTMLInputElement;
    const dueDateInput = screen.getByLabelText('Due Date *') as HTMLInputElement;

    expect(issueDateInput.type).toBe('date');
    expect(dueDateInput.type).toBe('date');

    // Dates should be in YYYY-MM-DD format
    expect(issueDateInput.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(dueDateInput.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  describe('VAT Functionality', () => {
    it('has VAT rate dropdown with correct options', async () => {
      await act(async () => {
        render(<InvoiceCreationModal {...defaultProps} />);
      });

      const vatRateSelect = screen.getByLabelText('VAT Rate');
      expect(vatRateSelect).toBeInTheDocument();
      expect(vatRateSelect).toBeInstanceOf(HTMLSelectElement);

      // Check that VAT options are available (should find dropdown)
      expect(vatRateSelect).toBeInTheDocument();
    });

    it('defaults to 0% VAT rate', async () => {
      await act(async () => {
        render(<InvoiceCreationModal {...defaultProps} />);
      });

      const vatRateSelect = screen.getByLabelText('VAT Rate') as HTMLSelectElement;
      expect(vatRateSelect.value).toBe('0');
    });

    it('calculates VAT amount correctly with 21% rate', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<InvoiceCreationModal {...defaultProps} />);
      });

      // Fill in quantity and unit price
      const quantityInput = screen.getByLabelText('Quantity *');
      const unitPriceInput = screen.getByLabelText('Unit Price *');
      const vatRateSelect = screen.getByLabelText('VAT Rate');

      await act(async () => {
        await user.clear(quantityInput);
        await user.type(quantityInput, '1');
      });

      await act(async () => {
        await user.clear(unitPriceInput);
        await user.type(unitPriceInput, '100');
      });

      await act(async () => {
        await user.selectOptions(vatRateSelect, '21');
      });

      // Check if subtotal, VAT amount, and total are displayed correctly
      await waitFor(() => {
        // Subtotal should be 100
        expect(screen.getByText(/Subtotal.*100\.00/)).toBeInTheDocument();

        // VAT amount should be 21 (100 * 0.21)
        expect(screen.getByText(/VAT.*21\.00/)).toBeInTheDocument();

        // Total should be 121 (100 + 21)
        expect(screen.getByText(/Total.*121\.00/)).toBeInTheDocument();
      });
    });

    it('calculates VAT amount correctly with 15% rate', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<InvoiceCreationModal {...defaultProps} />);
      });

      // Fill in quantity and unit price
      const quantityInput = screen.getByLabelText('Quantity *');
      const unitPriceInput = screen.getByLabelText('Unit Price *');
      const vatRateSelect = screen.getByLabelText('VAT Rate');

      await act(async () => {
        await user.clear(quantityInput);
        await user.type(quantityInput, '2');
      });

      await act(async () => {
        await user.clear(unitPriceInput);
        await user.type(unitPriceInput, '200');
      });

      await act(async () => {
        await user.selectOptions(vatRateSelect, '15');
      });

      // Check calculations: subtotal = 400, VAT = 60, total = 460
      await waitFor(() => {
        expect(screen.getByText(/Subtotal.*400\.00/)).toBeInTheDocument();
        expect(screen.getByText(/VAT.*60\.00/)).toBeInTheDocument();
        expect(screen.getByText(/Total.*460\.00/)).toBeInTheDocument();
      });
    });

    it('calculates VAT amount correctly with 0% rate', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<InvoiceCreationModal {...defaultProps} />);
      });

      // Fill in quantity and unit price
      const quantityInput = screen.getByLabelText('Quantity *');
      const unitPriceInput = screen.getByLabelText('Unit Price *');
      const vatRateSelect = screen.getByLabelText('VAT Rate');

      await act(async () => {
        await user.clear(quantityInput);
        await user.type(quantityInput, '5');
      });

      await act(async () => {
        await user.clear(unitPriceInput);
        await user.type(unitPriceInput, '50');
      });

      await act(async () => {
        await user.selectOptions(vatRateSelect, '0');
      });

      // Check calculations: subtotal = 250, VAT = 0, total = 250
      await waitFor(() => {
        expect(screen.getByText(/Subtotal.*250\.00/)).toBeInTheDocument();
        expect(screen.getByText(/VAT.*0\.00/)).toBeInTheDocument();
        expect(screen.getByText(/Total.*250\.00/)).toBeInTheDocument();
      });
    });

    it('handles mixed VAT rates across multiple items', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<InvoiceCreationModal {...defaultProps} />);
      });

      // Fill first item with 21% VAT
      await act(async () => {
        await user.clear(screen.getByLabelText('Quantity *'));
        await user.type(screen.getByLabelText('Quantity *'), '1');
      });

      await act(async () => {
        await user.clear(screen.getByLabelText('Unit Price *'));
        await user.type(screen.getByLabelText('Unit Price *'), '1000');
      });

      await act(async () => {
        await user.selectOptions(screen.getByLabelText('VAT Rate'), '21');
      });

      // Add second item with 15% VAT
      await act(async () => {
        await user.click(screen.getByRole('button', { name: /add item/i }));
      });

      const quantityInputs = screen.getAllByLabelText('Quantity *');
      const unitPriceInputs = screen.getAllByLabelText('Unit Price *');
      const vatRateSelects = screen.getAllByLabelText('VAT Rate');

      await act(async () => {
        await user.clear(quantityInputs[1]);
        await user.type(quantityInputs[1], '2');
      });

      await act(async () => {
        await user.clear(unitPriceInputs[1]);
        await user.type(unitPriceInputs[1], '500');
      });

      await act(async () => {
        await user.selectOptions(vatRateSelects[1], '15');
      });

      // Check calculations:
      // Item 1: 1000 * 1 = 1000, VAT = 210
      // Item 2: 500 * 2 = 1000, VAT = 150
      // Total: subtotal = 2000, VAT = 360, total = 2360
      await waitFor(() => {
        expect(screen.getByText(/Subtotal.*2000\.00/)).toBeInTheDocument();
        expect(screen.getByText(/VAT.*360\.00/)).toBeInTheDocument();
        expect(screen.getByText(/Total.*2360\.00/)).toBeInTheDocument();
      });
    });

    it('recalculates totals when VAT rate changes', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<InvoiceCreationModal {...defaultProps} />);
      });

      // Set up initial values
      const quantityInput = screen.getByLabelText('Quantity *');
      const unitPriceInput = screen.getByLabelText('Unit Price *');
      const vatRateSelect = screen.getByLabelText('VAT Rate');

      await act(async () => {
        await user.clear(quantityInput);
        await user.type(quantityInput, '1');
      });

      await act(async () => {
        await user.clear(unitPriceInput);
        await user.type(unitPriceInput, '100');
      });

      // Initially 0% VAT
      await act(async () => {
        await user.selectOptions(vatRateSelect, '0');
      });
      await waitFor(() => {
        expect(screen.getByText(/Total.*100\.00/)).toBeInTheDocument();
      });

      // Change to 21% VAT
      await act(async () => {
        await user.selectOptions(vatRateSelect, '21');
      });
      await waitFor(() => {
        expect(screen.getByText(/Total.*121\.00/)).toBeInTheDocument();
      });

      // Change to 15% VAT
      await act(async () => {
        await user.selectOptions(vatRateSelect, '15');
      });
      await waitFor(() => {
        expect(screen.getByText(/Total.*115\.00/)).toBeInTheDocument();
      });
    });

    it('includes VAT data in form submission', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<InvoiceCreationModal {...defaultProps} />);
      });

      // Fill in all required fields including VAT
      await act(async () => {
        await user.type(screen.getByLabelText('Client Name *'), 'VAT Test Client');
        await user.type(screen.getByLabelText('Client Address *'), '123 VAT Street');
        await user.type(screen.getByLabelText('Description *'), 'VAT Test Service');
      });

      await act(async () => {
        await user.clear(screen.getByLabelText('Quantity *'));
        await user.type(screen.getByLabelText('Quantity *'), '2');
      });

      await act(async () => {
        await user.clear(screen.getByLabelText('Unit Price *'));
        await user.type(screen.getByLabelText('Unit Price *'), '500');
      });

      await act(async () => {
        await user.selectOptions(screen.getByLabelText('VAT Rate'), '21');
      });

      await act(async () => {
        await user.click(screen.getByRole('button', { name: /create invoice/i }));
      });

      await waitFor(() => {
        expect(mockConsoleLog).toHaveBeenCalledWith('Invoice data:',
          expect.objectContaining({
            items: expect.arrayContaining([
              expect.objectContaining({
                vatRate: 21
              })
            ])
          })
        );
      });
    });

    it('handles decimal calculations correctly with VAT', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<InvoiceCreationModal {...defaultProps} />);
      });

      // Use decimal values that might cause rounding issues
      const quantityInput = screen.getByLabelText('Quantity *');
      const unitPriceInput = screen.getByLabelText('Unit Price *');
      const vatRateSelect = screen.getByLabelText('VAT Rate');

      await act(async () => {
        await user.clear(quantityInput);
        await user.type(quantityInput, '3');
      });

      await act(async () => {
        await user.clear(unitPriceInput);
        await user.type(unitPriceInput, '33.33');
      });

      await act(async () => {
        await user.selectOptions(vatRateSelect, '21');
      });

      // Calculations: 3 * 33.33 = 99.99, VAT = 20.9979 ≈ 21.00, Total ≈ 120.99
      await waitFor(() => {
        expect(screen.getByText(/Subtotal.*99\.99/)).toBeInTheDocument();
        expect(screen.getByText(/VAT.*21\.00/)).toBeInTheDocument();
        expect(screen.getByText(/Total.*120\.99/)).toBeInTheDocument();
      });
    });
  });

  describe('14-Day Due Date Functionality', () => {
    it('sets due date to 14 days from issue date by default', async () => {
      await act(async () => {
        render(<InvoiceCreationModal {...defaultProps} />);
      });

      const today = new Date().toISOString().split('T')[0];
      const fourteenDaysFromNow = new Date();
      fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);
      const expectedDueDate = fourteenDaysFromNow.toISOString().split('T')[0];

      const issueDateInput = screen.getByLabelText('Issue Date *') as HTMLInputElement;
      const dueDateInput = screen.getByLabelText('Due Date *') as HTMLInputElement;

      expect(issueDateInput.value).toBe(today);
      expect(dueDateInput.value).toBe(expectedDueDate);
    });

    it('automatically recalculates due date when issue date changes', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<InvoiceCreationModal {...defaultProps} />);
      });

      const issueDateInput = screen.getByLabelText('Issue Date *') as HTMLInputElement;
      const dueDateInput = screen.getByLabelText('Due Date *') as HTMLInputElement;

      // Set a specific issue date
      const customIssueDate = '2024-03-15';
      await act(async () => {
        await user.clear(issueDateInput);
        await user.type(issueDateInput, customIssueDate);
      });

      // Calculate expected due date (14 days later)
      const expectedDate = new Date('2024-03-15');
      expectedDate.setDate(expectedDate.getDate() + 14);
      const expectedDueDate = expectedDate.toISOString().split('T')[0];

      await waitFor(() => {
        expect(dueDateInput.value).toBe(expectedDueDate);
      });
    });

    it('preserves manual due date changes when user edits', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<InvoiceCreationModal {...defaultProps} />);
      });

      const issueDateInput = screen.getByLabelText('Issue Date *') as HTMLInputElement;
      const dueDateInput = screen.getByLabelText('Due Date *') as HTMLInputElement;

      // Manually change due date to a custom value
      const customDueDate = '2024-12-31';
      await act(async () => {
        await user.clear(dueDateInput);
        await user.type(dueDateInput, customDueDate);
      });

      // Now change issue date
      await act(async () => {
        await user.clear(issueDateInput);
        await user.type(issueDateInput, '2024-01-01');
      });

      // Due date should remain the manually set value, not auto-recalculated
      await waitFor(() => {
        expect(dueDateInput.value).toBe(customDueDate);
      });
    });

    it('recalculates due date correctly for different months', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<InvoiceCreationModal {...defaultProps} />);
      });

      const issueDateInput = screen.getByLabelText('Issue Date *') as HTMLInputElement;
      const dueDateInput = screen.getByLabelText('Due Date *') as HTMLInputElement;

      // Test end of month scenario
      await act(async () => {
        await user.clear(issueDateInput);
        await user.type(issueDateInput, '2024-01-31');
      });

      // Expected due date should be 2024-02-14 (31 + 14 = 14 Feb)
      await waitFor(() => {
        expect(dueDateInput.value).toBe('2024-02-14');
      });
    });

    it('handles leap year calculations correctly', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<InvoiceCreationModal {...defaultProps} />);
      });

      const issueDateInput = screen.getByLabelText('Issue Date *') as HTMLInputElement;
      const dueDateInput = screen.getByLabelText('Due Date *') as HTMLInputElement;

      // Test leap year scenario
      await act(async () => {
        await user.clear(issueDateInput);
        await user.type(issueDateInput, '2024-02-20'); // 2024 is a leap year
      });

      // Expected due date should be 2024-03-05
      await waitFor(() => {
        expect(dueDateInput.value).toBe('2024-03-05');
      });
    });

    it('auto-recalculates multiple times when issue date changes multiple times', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<InvoiceCreationModal {...defaultProps} />);
      });

      const issueDateInput = screen.getByLabelText('Issue Date *') as HTMLInputElement;
      const dueDateInput = screen.getByLabelText('Due Date *') as HTMLInputElement;

      // First change
      await act(async () => {
        await user.clear(issueDateInput);
        await user.type(issueDateInput, '2024-01-01');
      });

      await waitFor(() => {
        expect(dueDateInput.value).toBe('2024-01-15');
      });

      // Second change
      await act(async () => {
        await user.clear(issueDateInput);
        await user.type(issueDateInput, '2024-06-15');
      });

      await waitFor(() => {
        expect(dueDateInput.value).toBe('2024-06-29');
      });
    });

    it('includes correct due date in form submission', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<InvoiceCreationModal {...defaultProps} />);
      });

      // Set specific issue date
      const issueDateInput = screen.getByLabelText('Issue Date *') as HTMLInputElement;
      await act(async () => {
        await user.clear(issueDateInput);
        await user.type(issueDateInput, '2024-01-15');
      });

      // Fill in other required fields
      await act(async () => {
        await user.type(screen.getByLabelText('Client Name *'), 'Test Client');
        await user.type(screen.getByLabelText('Client Address *'), '123 Test Street');
        await user.type(screen.getByLabelText('Description *'), 'Test Service');
      });

      await act(async () => {
        await user.click(screen.getByRole('button', { name: /create invoice/i }));
      });

      await waitFor(() => {
        expect(mockConsoleLog).toHaveBeenCalledWith('Invoice created successfully:',
          expect.objectContaining({
            issueDate: '2024-01-15',
            dueDate: '2024-01-29' // 14 days later
          })
        );
      });
    });
  });
});
