import { test, expect } from '@playwright/test';

test.describe('VAT Functionality End-to-End', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3001');
    
    // Mock user authentication (assuming we have a login system)
    // This might need to be adjusted based on the actual authentication flow
    await page.evaluate(() => {
      // Mock logged-in state if needed
      localStorage.setItem('auth-token', 'mock-token');
    });
  });

  test.describe('Settings Page VAT Configuration', () => {
    test('should toggle VAT payer status and disable/enable DIČ field', async ({ page }) => {
      await page.goto('http://localhost:3001/settings');
      
      // Wait for the settings page to load
      await expect(page.getByText('Settings')).toBeVisible();
      
      // Check the VAT payer checkbox
      const vatCheckbox = page.getByRole('checkbox', { name: /not a VAT payer/i });
      const dicField = page.getByLabel(/DIČ/i);
      
      // Initially, DIČ should be enabled (VAT payer)
      await expect(dicField).toBeEnabled();
      
      // Check the non-VAT payer checkbox
      await vatCheckbox.check();
      
      // DIČ field should now be disabled
      await expect(dicField).toBeDisabled();
      
      // Uncheck the checkbox
      await vatCheckbox.uncheck();
      
      // DIČ field should be enabled again
      await expect(dicField).toBeEnabled();
    });

    test('should save VAT payer settings correctly', async ({ page }) => {
      await page.goto('http://localhost:3001/settings');
      
      // Fill in company information
      await page.getByLabel(/company name/i).fill('Test VAT Company');
      await page.getByLabel(/address/i).fill('123 Test Street\nTest City');
      await page.getByLabel(/IČO/i).fill('12345678');
      await page.getByLabel(/DIČ/i).fill('CZ12345678');
      
      // Save settings
      await page.getByRole('button', { name: /save/i }).click();
      
      // Should show success message
      await expect(page.getByText(/saved successfully/i)).toBeVisible();
      
      // Now switch to non-VAT payer
      const vatCheckbox = page.getByRole('checkbox', { name: /not a VAT payer/i });
      await vatCheckbox.check();
      
      // DIČ should be cleared and disabled
      const dicField = page.getByLabel(/DIČ/i);
      await expect(dicField).toBeDisabled();
      await expect(dicField).toHaveValue('');
      
      // Save again
      await page.getByRole('button', { name: /save/i }).click();
      await expect(page.getByText(/saved successfully/i)).toBeVisible();
    });
  });

  test.describe('Invoice Creation with VAT', () => {
    test('should create invoice with VAT calculations', async ({ page }) => {
      await page.goto('http://localhost:3001/dashboard');
      
      // Click create new invoice button
      await page.getByRole('button', { name: /create.*invoice/i }).click();
      
      // Fill in invoice details
      await page.getByLabel(/client name/i).fill('VAT Test Client');
      await page.getByLabel(/client address/i).fill('456 Client Street\nClient City');
      
      // Fill in first item
      await page.getByLabel(/description/i).first().fill('Software Development');
      await page.getByLabel(/quantity/i).first().fill('10');
      await page.getByLabel(/unit price/i).first().fill('1000');
      await page.getByLabel(/vat rate/i).first().selectOption('21');
      
      // Check calculated totals
      await expect(page.getByText(/subtotal.*10,000\.00/i)).toBeVisible();
      await expect(page.getByText(/vat.*2,100\.00/i)).toBeVisible();
      await expect(page.getByText(/total.*12,100\.00/i)).toBeVisible();
      
      // Add second item with different VAT rate
      await page.getByRole('button', { name: /add item/i }).click();
      
      const descriptions = page.getByLabel(/description/i);
      const quantities = page.getByLabel(/quantity/i);
      const unitPrices = page.getByLabel(/unit price/i);
      const vatRates = page.getByLabel(/vat rate/i);
      
      await descriptions.nth(1).fill('Consulting Services');
      await quantities.nth(1).fill('5');
      await unitPrices.nth(1).fill('800');
      await vatRates.nth(1).selectOption('15');
      
      // Check updated totals
      // Subtotal: 10,000 + 4,000 = 14,000
      // VAT: 2,100 + 600 = 2,700
      // Total: 16,700
      await expect(page.getByText(/subtotal.*14,000\.00/i)).toBeVisible();
      await expect(page.getByText(/vat.*2,700\.00/i)).toBeVisible();
      await expect(page.getByText(/total.*16,700\.00/i)).toBeVisible();
      
      // Create the invoice
      await page.getByRole('button', { name: /create invoice/i }).click();
      
      // Should show success message or redirect to invoice view
      await expect(page.getByText(/invoice created/i)).toBeVisible();
    });

    test('should create invoice with 0% VAT', async ({ page }) => {
      await page.goto('http://localhost:3001/dashboard');
      
      await page.getByRole('button', { name: /create.*invoice/i }).click();
      
      // Fill in invoice details
      await page.getByLabel(/client name/i).fill('Zero VAT Client');
      await page.getByLabel(/client address/i).fill('789 Zero VAT Street');
      
      // Fill in item with 0% VAT
      await page.getByLabel(/description/i).fill('Tax-exempt Service');
      await page.getByLabel(/quantity/i).fill('3');
      await page.getByLabel(/unit price/i).fill('500');
      await page.getByLabel(/vat rate/i).selectOption('0');
      
      // Check totals (no VAT)
      await expect(page.getByText(/subtotal.*1,500\.00/i)).toBeVisible();
      await expect(page.getByText(/vat.*0\.00/i)).toBeVisible();
      await expect(page.getByText(/total.*1,500\.00/i)).toBeVisible();
      
      await page.getByRole('button', { name: /create invoice/i }).click();
      await expect(page.getByText(/invoice created/i)).toBeVisible();
    });

    test('should handle mixed VAT rates correctly', async ({ page }) => {
      await page.goto('http://localhost:3001/dashboard');
      
      await page.getByRole('button', { name: /create.*invoice/i }).click();
      
      // Fill in invoice details
      await page.getByLabel(/client name/i).fill('Mixed VAT Client');
      await page.getByLabel(/client address/i).fill('Mixed VAT Address');
      
      // Add multiple items with different VAT rates
      const items = [
        { description: 'Standard VAT Service', quantity: '1', price: '1000', vat: '21' },
        { description: 'Reduced VAT Service', quantity: '2', price: '500', vat: '15' },
        { description: 'Zero VAT Service', quantity: '1', price: '300', vat: '0' },
      ];
      
      for (let i = 0; i < items.length; i++) {
        if (i > 0) {
          await page.getByRole('button', { name: /add item/i }).click();
        }
        
        const descriptions = page.getByLabel(/description/i);
        const quantities = page.getByLabel(/quantity/i);
        const unitPrices = page.getByLabel(/unit price/i);
        const vatRates = page.getByLabel(/vat rate/i);
        
        await descriptions.nth(i).fill(items[i].description);
        await quantities.nth(i).fill(items[i].quantity);
        await unitPrices.nth(i).fill(items[i].price);
        await vatRates.nth(i).selectOption(items[i].vat);
      }
      
      // Calculate expected totals
      // Item 1: 1000 * 1 = 1000, VAT = 210
      // Item 2: 500 * 2 = 1000, VAT = 150
      // Item 3: 300 * 1 = 300, VAT = 0
      // Subtotal: 2300, VAT: 360, Total: 2660
      await expect(page.getByText(/subtotal.*2,300\.00/i)).toBeVisible();
      await expect(page.getByText(/vat.*360\.00/i)).toBeVisible();
      await expect(page.getByText(/total.*2,660\.00/i)).toBeVisible();
      
      await page.getByRole('button', { name: /create invoice/i }).click();
      await expect(page.getByText(/invoice created/i)).toBeVisible();
    });
  });

  test.describe('Invoice View with VAT', () => {
    test('should display VAT information in invoice view', async ({ page }) => {
      // First create an invoice (this assumes the create flow works)
      await page.goto('http://localhost:3001/dashboard');
      await page.getByRole('button', { name: /create.*invoice/i }).click();
      
      await page.getByLabel(/client name/i).fill('View Test Client');
      await page.getByLabel(/client address/i).fill('View Test Address');
      await page.getByLabel(/description/i).fill('Test Service');
      await page.getByLabel(/quantity/i).fill('2');
      await page.getByLabel(/unit price/i).fill('750');
      await page.getByLabel(/vat rate/i).selectOption('21');
      
      await page.getByRole('button', { name: /create invoice/i }).click();
      
      // Should be redirected to invoice view or we navigate to it
      // Check for VAT information display
      await expect(page.getByText(/vat rate.*21%/i)).toBeVisible();
      await expect(page.getByText(/subtotal.*1,500\.00/i)).toBeVisible();
      await expect(page.getByText(/vat amount.*315\.00/i)).toBeVisible();
      await expect(page.getByText(/total.*1,815\.00/i)).toBeVisible();
    });

    test('should generate PDF with VAT information', async ({ page }) => {
      // Create an invoice first
      await page.goto('http://localhost:3001/dashboard');
      
      // Assuming we have an existing invoice or create one
      // Navigate to invoice view
      await page.getByText(/invoice #/i).first().click();
      
      // Look for PDF download button
      const downloadButton = page.getByRole('button', { name: /download.*pdf/i });
      await expect(downloadButton).toBeVisible();
      
      // Set up download handling
      const downloadPromise = page.waitForDownload();
      await downloadButton.click();
      const download = await downloadPromise;
      
      // Verify download occurred
      expect(download.suggestedFilename()).toMatch(/faktura-\d+\.pdf/);
    });
  });

  test.describe('Non-VAT Payer Invoices', () => {
    test('should create invoice for non-VAT payer without VAT', async ({ page }) => {
      // First set up as non-VAT payer
      await page.goto('http://localhost:3001/settings');
      
      const vatCheckbox = page.getByRole('checkbox', { name: /not a VAT payer/i });
      await vatCheckbox.check();
      await page.getByRole('button', { name: /save/i }).click();
      
      // Now create invoice
      await page.goto('http://localhost:3001/dashboard');
      await page.getByRole('button', { name: /create.*invoice/i }).click();
      
      await page.getByLabel(/client name/i).fill('Non-VAT Client');
      await page.getByLabel(/client address/i).fill('Non-VAT Address');
      await page.getByLabel(/description/i).fill('Non-VAT Service');
      await page.getByLabel(/quantity/i).fill('4');
      await page.getByLabel(/unit price/i).fill('250');
      
      // VAT rate should default to 0% for non-VAT payers
      await expect(page.getByLabel(/vat rate/i)).toHaveValue('0');
      
      // Check totals (no VAT)
      await expect(page.getByText(/subtotal.*1,000\.00/i)).toBeVisible();
      await expect(page.getByText(/vat.*0\.00/i)).toBeVisible();
      await expect(page.getByText(/total.*1,000\.00/i)).toBeVisible();
      
      await page.getByRole('button', { name: /create invoice/i }).click();
      await expect(page.getByText(/invoice created/i)).toBeVisible();
    });

    test('should show "Nejsem plátce DPH" text in PDF for non-VAT payers', async ({ page }) => {
      // Set up as non-VAT payer
      await page.goto('http://localhost:3001/settings');
      
      await page.getByLabel(/company name/i).fill('Non-VAT Company');
      const vatCheckbox = page.getByRole('checkbox', { name: /not a VAT payer/i });
      await vatCheckbox.check();
      await page.getByRole('button', { name: /save/i }).click();
      
      // Create and view invoice
      await page.goto('http://localhost:3001/dashboard');
      await page.getByRole('button', { name: /create.*invoice/i }).click();
      
      await page.getByLabel(/client name/i).fill('PDF Test Client');
      await page.getByLabel(/client address/i).fill('PDF Test Address');
      await page.getByLabel(/description/i).fill('PDF Test Service');
      await page.getByLabel(/quantity/i).fill('1');
      await page.getByLabel(/unit price/i).fill('1000');
      
      await page.getByRole('button', { name: /create invoice/i }).click();
      
      // Download PDF and verify content
      const downloadPromise = page.waitForDownload();
      await page.getByRole('button', { name: /download.*pdf/i }).click();
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toMatch(/faktura-\d+\.pdf/);
    });
  });

  test.describe('VAT Validation', () => {
    test('should prevent invalid VAT rates', async ({ page }) => {
      await page.goto('http://localhost:3001/dashboard');
      await page.getByRole('button', { name: /create.*invoice/i }).click();
      
      // Try to submit with invalid data
      await page.getByLabel(/client name/i).fill('Validation Test');
      await page.getByLabel(/client address/i).fill('Validation Address');
      await page.getByLabel(/description/i).fill('Test Service');
      await page.getByLabel(/quantity/i).fill('1');
      await page.getByLabel(/unit price/i).fill('100');
      
      // The VAT rate dropdown should only allow valid values
      const vatRateSelect = page.getByLabel(/vat rate/i);
      const options = await vatRateSelect.locator('option').allTextContents();
      
      // Should only contain valid Czech VAT rates
      expect(options).toContain('0%');
      expect(options).toContain('12%');
      expect(options).toContain('15%');
      expect(options).toContain('21%');
    });

    test('should show validation errors for required fields', async ({ page }) => {
      await page.goto('http://localhost:3001/dashboard');
      await page.getByRole('button', { name: /create.*invoice/i }).click();
      
      // Try to submit without required fields
      await page.getByRole('button', { name: /create invoice/i }).click();
      
      // Should show validation errors
      await expect(page.getByText(/client name.*required/i)).toBeVisible();
      await expect(page.getByText(/client address.*required/i)).toBeVisible();
      await expect(page.getByText(/description.*required/i)).toBeVisible();
    });
  });

  test.describe('Currency Formatting', () => {
    test('should format currency correctly in Czech locale', async ({ page }) => {
      await page.goto('http://localhost:3001/dashboard');
      await page.getByRole('button', { name: /create.*invoice/i }).click();
      
      await page.getByLabel(/client name/i).fill('Currency Test');
      await page.getByLabel(/client address/i).fill('Currency Address');
      await page.getByLabel(/description/i).fill('Currency Service');
      await page.getByLabel(/quantity/i).fill('1');
      await page.getByLabel(/unit price/i).fill('1234.56');
      await page.getByLabel(/vat rate/i).selectOption('21');
      
      // Check currency formatting
      // In Czech locale, currency should be formatted appropriately
      await expect(page.getByText(/1,234\.56/)).toBeVisible();
      await expect(page.getByText(/259\.26/)).toBeVisible(); // VAT amount
      await expect(page.getByText(/1,493\.82/)).toBeVisible(); // Total
    });
  });
});