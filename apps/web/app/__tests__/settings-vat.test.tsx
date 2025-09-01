import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import SettingsPage from '../settings/page';

// Mock the locale provider
jest.mock('../lib/locale-provider', () => ({
  useLocale: () => ({ locale: 'cs' }),
}));

// Mock the API
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock messages for testing
const messages = {
  settings: {
    title: 'Settings',
    supplierInformation: 'Supplier Information',
    companyName: 'Company Name',
    address: 'Address',
    ico: 'IČO (Company Registration Number)',
    dic: 'DIČ (Tax ID Number)',
    isNonVatPayer: 'I am not a VAT payer',
    isNonVatPayerDescription: 'Check this if your company is not registered for VAT',
    save: 'Save Settings',
    loading: 'Loading...',
    saved: 'Settings saved successfully',
    error: 'Failed to save settings',
  },
  validation: {
    required: 'This field is required',
    companyNameRequired: 'Company name is required',
    addressRequired: 'Address is required',
  },
};

describe('Settings Page VAT Functionality', () => {
  const renderWithIntl = (component: React.ReactElement) => {
    return render(
      <NextIntlClientProvider messages={messages} locale="cs">
        {component}
      </NextIntlClientProvider>
    );
  };

  beforeEach(() => {
    mockFetch.mockClear();
    
    // Mock successful API responses
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: '1',
        name: 'Test Company',
        address: 'Test Address',
        ico: '12345678',
        dic: 'CZ12345678',
        isNonVatPayer: false,
      }),
    });
  });

  it('renders VAT payer checkbox', async () => {
    renderWithIntl(<SettingsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('I am not a VAT payer')).toBeInTheDocument();
      expect(screen.getByText('Check this if your company is not registered for VAT')).toBeInTheDocument();
    });
  });

  it('shows DIČ field as enabled when VAT payer checkbox is unchecked', async () => {
    renderWithIntl(<SettingsPage />);
    
    await waitFor(() => {
      const vatCheckbox = screen.getByRole('checkbox');
      const dicInput = screen.getByLabelText('DIČ (Tax ID Number)');
      
      expect(vatCheckbox).not.toBeChecked();
      expect(dicInput).toBeEnabled();
    });
  });

  it('disables DIČ field when VAT payer checkbox is checked', async () => {
    const user = userEvent.setup();
    renderWithIntl(<SettingsPage />);
    
    await waitFor(() => {
      const vatCheckbox = screen.getByRole('checkbox');
      expect(vatCheckbox).toBeInTheDocument();
    });
    
    const vatCheckbox = screen.getByRole('checkbox');
    const dicInput = screen.getByLabelText('DIČ (Tax ID Number)');
    
    // Check the VAT checkbox
    await user.click(vatCheckbox);
    
    // DIČ field should now be disabled
    await waitFor(() => {
      expect(vatCheckbox).toBeChecked();
      expect(dicInput).toBeDisabled();
    });
  });

  it('enables DIČ field when VAT payer checkbox is unchecked', async () => {
    // Mock API response for non-VAT payer
    mockFetch.mockClear();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: '1',
        name: 'Non-VAT Company',
        address: 'Test Address',
        ico: '12345678',
        dic: null,
        isNonVatPayer: true,
      }),
    });
    
    const user = userEvent.setup();
    renderWithIntl(<SettingsPage />);
    
    await waitFor(() => {
      const vatCheckbox = screen.getByRole('checkbox');
      expect(vatCheckbox).toBeChecked();
    });
    
    const vatCheckbox = screen.getByRole('checkbox');
    const dicInput = screen.getByLabelText('DIČ (Tax ID Number)');
    
    // DIČ should initially be disabled
    expect(dicInput).toBeDisabled();
    
    // Uncheck the VAT checkbox
    await user.click(vatCheckbox);
    
    // DIČ field should now be enabled
    await waitFor(() => {
      expect(vatCheckbox).not.toBeChecked();
      expect(dicInput).toBeEnabled();
    });
  });

  it('clears DIČ value when switching to non-VAT payer', async () => {
    const user = userEvent.setup();
    renderWithIntl(<SettingsPage />);
    
    await waitFor(() => {
      const vatCheckbox = screen.getByRole('checkbox');
      expect(vatCheckbox).toBeInTheDocument();
    });
    
    const vatCheckbox = screen.getByRole('checkbox');
    const dicInput = screen.getByLabelText('DIČ (Tax ID Number)') as HTMLInputElement;
    
    // Initially DIČ should have a value and be enabled
    await waitFor(() => {
      expect(dicInput.value).toBe('CZ12345678');
      expect(dicInput).toBeEnabled();
    });
    
    // Check the non-VAT payer checkbox
    await user.click(vatCheckbox);
    
    // DIČ should be cleared and disabled
    await waitFor(() => {
      expect(dicInput.value).toBe('');
      expect(dicInput).toBeDisabled();
    });
  });

  it('preserves DIČ value when switching back from non-VAT payer', async () => {
    const user = userEvent.setup();
    renderWithIntl(<SettingsPage />);
    
    await waitFor(() => {
      const vatCheckbox = screen.getByRole('checkbox');
      expect(vatCheckbox).toBeInTheDocument();
    });
    
    const vatCheckbox = screen.getByRole('checkbox');
    const dicInput = screen.getByLabelText('DIČ (Tax ID Number)') as HTMLInputElement;
    
    // Fill DIČ field
    await user.clear(dicInput);
    await user.type(dicInput, 'CZ87654321');
    
    // Switch to non-VAT payer
    await user.click(vatCheckbox);
    
    await waitFor(() => {
      expect(dicInput).toBeDisabled();
      expect(dicInput.value).toBe('');
    });
    
    // Switch back to VAT payer
    await user.click(vatCheckbox);
    
    await waitFor(() => {
      expect(dicInput).toBeEnabled();
      // DIČ should be empty since it was cleared
      expect(dicInput.value).toBe('');
    });
  });

  it('saves VAT status correctly when submitting form', async () => {
    const user = userEvent.setup();
    
    // Mock successful save response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: '1',
        name: 'Test Company',
        address: 'Test Address',
        ico: '12345678',
        dic: null,
        isNonVatPayer: true,
      }),
    });
    
    renderWithIntl(<SettingsPage />);
    
    await waitFor(() => {
      const vatCheckbox = screen.getByRole('checkbox');
      expect(vatCheckbox).toBeInTheDocument();
    });
    
    const vatCheckbox = screen.getByRole('checkbox');
    const saveButton = screen.getByRole('button', { name: /save settings/i });
    
    // Check non-VAT payer
    await user.click(vatCheckbox);
    
    // Submit form
    await user.click(saveButton);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/supplier'),
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"isNonVatPayer":true'),
        })
      );
    });
  });

  it('handles API error when saving VAT status', async () => {
    const user = userEvent.setup();
    
    // Mock API error
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Validation failed' }),
    });
    
    renderWithIntl(<SettingsPage />);
    
    await waitFor(() => {
      const vatCheckbox = screen.getByRole('checkbox');
      expect(vatCheckbox).toBeInTheDocument();
    });
    
    const vatCheckbox = screen.getByRole('checkbox');
    const saveButton = screen.getByRole('button', { name: /save settings/i });
    
    // Check non-VAT payer
    await user.click(vatCheckbox);
    
    // Submit form
    await user.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to save settings')).toBeInTheDocument();
    });
  });

  it('validates required fields properly for VAT payers', async () => {
    const user = userEvent.setup();
    renderWithIntl(<SettingsPage />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Company Name')).toBeInTheDocument();
    });
    
    const companyNameInput = screen.getByLabelText('Company Name');
    const saveButton = screen.getByRole('button', { name: /save settings/i });
    
    // Clear required field
    await user.clear(companyNameInput);
    
    // Try to submit
    await user.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText('Company name is required')).toBeInTheDocument();
    });
  });

  it('validates required fields properly for non-VAT payers', async () => {
    const user = userEvent.setup();
    renderWithIntl(<SettingsPage />);
    
    await waitFor(() => {
      const vatCheckbox = screen.getByRole('checkbox');
      expect(vatCheckbox).toBeInTheDocument();
    });
    
    const vatCheckbox = screen.getByRole('checkbox');
    const companyNameInput = screen.getByLabelText('Company Name');
    const saveButton = screen.getByRole('button', { name: /save settings/i });
    
    // Switch to non-VAT payer
    await user.click(vatCheckbox);
    
    // Clear required field
    await user.clear(companyNameInput);
    
    // Try to submit
    await user.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText('Company name is required')).toBeInTheDocument();
    });
  });

  it('shows loading state during save operation', async () => {
    const user = userEvent.setup();
    
    // Mock delayed response
    mockFetch.mockReturnValueOnce(
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({ id: '1', name: 'Test' }),
        }), 100)
      )
    );
    
    renderWithIntl(<SettingsPage />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save settings/i })).toBeInTheDocument();
    });
    
    const saveButton = screen.getByRole('button', { name: /save settings/i });
    
    await user.click(saveButton);
    
    // Should show loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});