import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/app/lib/auth-store';
import { customerApi, aresApi } from '@/app/lib/api';
import CustomersPage from '../page';

// Mock dependencies
const mockPush = jest.fn();
const mockT = jest.fn((key) => key);

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('next-intl', () => ({
  useTranslations: () => mockT,
}));

jest.mock('@/app/lib/auth-store', () => ({
  useAuthStore: () => ({
    isAuthenticated: true,
  }),
}));

jest.mock('@/app/lib/api', () => ({
  customerApi: {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  aresApi: {
    lookup: jest.fn(),
  },
}));

// Mock ARES response data
const mockAresResponse = {
  ico: '12345678',
  name: 'Test Company s.r.o.',
  address: {
    street: 'Testovací 123',
    city: 'Praha',
    zipCode: '110 00',
    country: 'Czech Republic'
  },
  registration: {
    registrationType: 'obchodni_rejstrik',
    registrationCourt: 'Krajský soud',
    registrationFileNumber: 'B 123/MSPH',
    automaticLegalText: 'Společnost zapsána v obchodním rejstříku',
    registryCode: 'VR',
    isBusinessPerson: false
  },
  isActive: true,
  dic: 'CZ12345678'
};

const mockCustomers = [
  {
    id: '1',
    userId: 'user1',
    name: 'Existing Customer',
    street: 'Some Street 1',
    city: 'Some City',
    zipCode: '12345',
    country: 'Czech Republic',
    ico: '87654321',
    dic: 'CZ87654321',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  }
];

describe('CustomersPage ARES Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (customerApi.list as jest.Mock).mockResolvedValue(mockCustomers);
    (customerApi.create as jest.Mock).mockResolvedValue({ id: '2', ...mockAresResponse });
    (customerApi.update as jest.Mock).mockResolvedValue({ id: '1', ...mockAresResponse });
    (aresApi.lookup as jest.Mock).mockResolvedValue(mockAresResponse);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Create Customer Modal - ARES Integration', () => {
    test('should trigger ARES lookup on IČO field blur with valid 8-digit IČO', async () => {
      render(<CustomersPage />);
      
      // Wait for initial data load
      await waitFor(() => {
        expect(screen.getByText('Add Customer')).toBeInTheDocument();
      });

      // Open create modal
      fireEvent.click(screen.getByText('Add Customer'));
      
      // Wait for modal to open
      await waitFor(() => {
        expect(screen.getByText('Add New Customer')).toBeInTheDocument();
      });

      // Find IČO input and blur with valid IČO
      const icoInput = screen.getByPlaceholderText('Enter IČO');
      
      await act(async () => {
        fireEvent.change(icoInput, { target: { value: '12345678' } });
        fireEvent.blur(icoInput);
      });

      // Verify ARES API was called
      await waitFor(() => {
        expect(aresApi.lookup).toHaveBeenCalledWith('12345678');
      });

      // Verify form fields were auto-filled
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Company s.r.o.')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Testovací 123')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Praha')).toBeInTheDocument();
        expect(screen.getByDisplayValue('110 00')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Czech Republic')).toBeInTheDocument();
        expect(screen.getByDisplayValue('CZ12345678')).toBeInTheDocument();
      });
    });

    test('should not trigger ARES lookup with invalid IČO format', async () => {
      render(<CustomersPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Add Customer')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Add Customer'));
      
      await waitFor(() => {
        expect(screen.getByText('Add New Customer')).toBeInTheDocument();
      });

      const icoInput = screen.getByPlaceholderText('Enter IČO');
      
      await act(async () => {
        // Test with invalid formats
        fireEvent.change(icoInput, { target: { value: '1234567' } }); // 7 digits
        fireEvent.blur(icoInput);
      });

      // Should not call ARES API
      expect(aresApi.lookup).not.toHaveBeenCalled();

      await act(async () => {
        fireEvent.change(icoInput, { target: { value: '123456789' } }); // 9 digits
        fireEvent.blur(icoInput);
      });

      expect(aresApi.lookup).not.toHaveBeenCalled();

      await act(async () => {
        fireEvent.change(icoInput, { target: { value: '1234567a' } }); // contains letter
        fireEvent.blur(icoInput);
      });

      expect(aresApi.lookup).not.toHaveBeenCalled();
    });

    test('should show loading indicator during ARES lookup', async () => {
      // Mock delayed response
      (aresApi.lookup as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockAresResponse), 500))
      );

      render(<CustomersPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Add Customer')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Add Customer'));
      
      await waitFor(() => {
        expect(screen.getByText('Add New Customer')).toBeInTheDocument();
      });

      const icoInput = screen.getByPlaceholderText('Enter IČO');
      
      await act(async () => {
        fireEvent.change(icoInput, { target: { value: '12345678' } });
        fireEvent.blur(icoInput);
      });

      // Should show loading spinner
      await waitFor(() => {
        const spinners = screen.getAllByRole('generic', { hidden: true });
        const loadingSpinner = spinners.find(el => el.classList.contains('animate-spin'));
        expect(loadingSpinner).toBeInTheDocument();
      });
      expect(icoInput).toBeDisabled();
    });

    test('should handle ARES lookup errors gracefully', async () => {
      // Mock API error responses
      const testCases = [
        {
          error: { response: { status: 404 } },
          expectedMessage: 'Company with this IČO was not found in ARES registry'
        },
        {
          error: { response: { status: 400, data: { message: 'Invalid IČO' } } },
          expectedMessage: 'Invalid IČO'
        },
        {
          error: { response: { status: 500 } },
          expectedMessage: 'Failed to fetch company information from ARES'
        },
        {
          error: new Error('Network error'),
          expectedMessage: 'Failed to fetch company information from ARES'
        }
      ];

      for (const testCase of testCases) {
        (aresApi.lookup as jest.Mock).mockRejectedValueOnce(testCase.error);

        render(<CustomersPage />);
        
        await waitFor(() => {
          expect(screen.getByText('Add Customer')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Add Customer'));
        
        await waitFor(() => {
          expect(screen.getByText('Add New Customer')).toBeInTheDocument();
        });

        const icoInput = screen.getByPlaceholderText('Enter IČO');
        
        await act(async () => {
          fireEvent.change(icoInput, { target: { value: '12345678' } });
          fireEvent.blur(icoInput);
        });

        // Should display error message
        await waitFor(() => {
          expect(screen.getByText(testCase.expectedMessage)).toBeInTheDocument();
        });

        // Clean up for next iteration
        act(() => {
          fireEvent.click(screen.getByText('Cancel'));
        });
      }
    });
  });

  describe('Edit Customer Modal - ARES Integration', () => {
    test('should trigger ARES lookup on IČO field blur in edit modal', async () => {
      render(<CustomersPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Existing Customer')).toBeInTheDocument();
      });

      // Click edit button for first customer
      const editButtons = screen.getAllByRole('button');
      const editButton = editButtons.find(button => 
        button.querySelector('svg')?.classList.contains('lucide-edit') ||
        button.innerHTML.includes('Edit')
      );
      
      if (editButton) {
        fireEvent.click(editButton);
      }

      await waitFor(() => {
        expect(screen.getByText('Edit Customer')).toBeInTheDocument();
      });

      // Find IČO input in edit modal
      const icoInput = screen.getAllByPlaceholderText('Enter IČO').find(input => 
        (input as HTMLElement).id === 'edit-ico'
      ) as HTMLInputElement;

      await act(async () => {
        fireEvent.change(icoInput, { target: { value: '12345678' } });
        fireEvent.blur(icoInput);
      });

      // Verify ARES API was called
      await waitFor(() => {
        expect(aresApi.lookup).toHaveBeenCalledWith('12345678');
      });

      // Verify form fields were auto-filled
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Company s.r.o.')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Testovací 123')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Praha')).toBeInTheDocument();
      });
    });
  });

  describe('Error State Management', () => {
    test('should clear ARES errors when modal closes', async () => {
      (aresApi.lookup as jest.Mock).mockRejectedValueOnce({
        response: { status: 404 }
      });

      render(<CustomersPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Add Customer')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Add Customer'));
      
      await waitFor(() => {
        expect(screen.getByText('Add New Customer')).toBeInTheDocument();
      });

      const icoInput = screen.getByPlaceholderText('Enter IČO');
      
      await act(async () => {
        fireEvent.change(icoInput, { target: { value: '12345678' } });
        fireEvent.blur(icoInput);
      });

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText('Company with this IČO was not found in ARES registry')).toBeInTheDocument();
      });

      // Close modal
      fireEvent.click(screen.getByText('Cancel'));

      // Reopen modal - error should be cleared
      fireEvent.click(screen.getByText('Add Customer'));
      
      await waitFor(() => {
        expect(screen.getByText('Add New Customer')).toBeInTheDocument();
      });

      // Error message should not be present
      expect(screen.queryByText('Company with this IČO was not found in ARES registry')).not.toBeInTheDocument();
    });
  });

  describe('Integration with Customer Creation/Update', () => {
    test('should successfully create customer with ARES-filled data', async () => {
      render(<CustomersPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Add Customer')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Add Customer'));
      
      await waitFor(() => {
        expect(screen.getByText('Add New Customer')).toBeInTheDocument();
      });

      const icoInput = screen.getByPlaceholderText('Enter IČO');
      
      // Trigger ARES lookup
      await act(async () => {
        fireEvent.change(icoInput, { target: { value: '12345678' } });
        fireEvent.blur(icoInput);
      });

      // Wait for auto-fill
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Company s.r.o.')).toBeInTheDocument();
      });

      // Submit form
      fireEvent.click(screen.getByText('Save Customer'));

      // Verify customer creation was called with correct data
      await waitFor(() => {
        expect(customerApi.create).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Company s.r.o.',
            street: 'Testovací 123',
            city: 'Praha',
            zipCode: '110 00',
            country: 'Czech Republic',
            ico: '12345678',
            dic: 'CZ12345678'
          })
        );
      });
    });
  });
});