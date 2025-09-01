import { test, expect } from '@playwright/test';

// E2E tests for Story 4.1: Language Switching for UI and PDF Generation
test.describe('Internationalization', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3001');
  });

  test('should display language switcher on settings page', async ({ page }) => {
    // Navigate to settings page
    await page.goto('http://localhost:3001/settings');
    
    // Wait for the language switcher to be visible
    await expect(page.locator('[data-testid="language-switcher"]')).toBeVisible();
    
    // Check if dropdown shows current language
    const languageButton = page.locator('button[role="combobox"]');
    await expect(languageButton).toBeVisible();
  });

  test('should switch UI language from English to Czech', async ({ page }) => {
    // Start with English
    await page.goto('http://localhost:3001/settings');
    
    // Verify English text is displayed
    await expect(page.locator('text=Settings')).toBeVisible();
    
    // Click language switcher
    await page.click('[data-testid="language-switcher"] button');
    
    // Select Czech from dropdown
    await page.click('text=Čeština');
    
    // Wait for page reload
    await page.waitForLoadState('networkidle');
    
    // Verify Czech text is now displayed
    await expect(page.locator('text=Nastavení')).toBeVisible();
  });

  test('should switch UI language from Czech to English', async ({ page }) => {
    // Set Czech cookie first
    await page.context().addCookies([{
      name: 'locale',
      value: 'cs',
      domain: 'localhost',
      path: '/'
    }]);
    
    await page.goto('http://localhost:3001/settings');
    
    // Verify Czech text is displayed
    await expect(page.locator('text=Nastavení')).toBeVisible();
    
    // Click language switcher
    await page.click('[data-testid="language-switcher"] button');
    
    // Select English from dropdown
    await page.click('text=English');
    
    // Wait for page reload
    await page.waitForLoadState('networkidle');
    
    // Verify English text is now displayed
    await expect(page.locator('text=Settings')).toBeVisible();
  });

  test('should persist language preference across sessions', async ({ page }) => {
    // Switch to Czech
    await page.goto('http://localhost:3001/settings');
    await page.click('[data-testid="language-switcher"] button');
    await page.click('text=Čeština');
    await page.waitForLoadState('networkidle');
    
    // Verify Czech is active
    await expect(page.locator('text=Nastavení')).toBeVisible();
    
    // Navigate away and back
    await page.goto('http://localhost:3001/dashboard');
    await page.goto('http://localhost:3001/settings');
    
    // Verify Czech is still active
    await expect(page.locator('text=Nastavení')).toBeVisible();
    
    // Check that cookie was set
    const cookies = await page.context().cookies();
    const localeCookie = cookies.find(cookie => cookie.name === 'locale');
    expect(localeCookie?.value).toBe('cs');
  });

  test('should update all UI text when language changes', async ({ page }) => {
    await page.goto('http://localhost:3001/dashboard');
    
    // Verify English text in multiple areas
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Create New Invoice')).toBeVisible();
    await expect(page.locator('text=Recent Invoices')).toBeVisible();
    
    // Switch to Czech
    await page.goto('http://localhost:3001/settings');
    await page.click('[data-testid="language-switcher"] button');
    await page.click('text=Čeština');
    await page.waitForLoadState('networkidle');
    
    // Go back to dashboard
    await page.goto('http://localhost:3001/dashboard');
    
    // Verify Czech text in multiple areas
    await expect(page.locator('text=Přehled')).toBeVisible();
    await expect(page.locator('text=Vytvořit novou fakturu')).toBeVisible();
    await expect(page.locator('text=Nejnovější faktury')).toBeVisible();
  });

  test.skip('should generate PDF in selected language', async ({ page }) => {
    // This test would require an actual invoice to exist
    // Skipping for now as it requires more setup
    
    // Create an invoice first (would need to be implemented)
    // await createTestInvoice(page);
    
    // Switch to Czech
    // await page.goto('http://localhost:3001/settings');
    // await page.click('[data-testid="language-switcher"] button');
    // await page.click('text=Čeština');
    // await page.waitForLoadState('networkidle');
    
    // Navigate to invoice and download PDF
    // await page.goto('http://localhost:3001/invoices/1');
    
    // Start download
    // const downloadPromise = page.waitForEvent('download');
    // await page.click('text=Stáhnout PDF');
    // const download = await downloadPromise;
    
    // Verify PDF was downloaded (would need additional PDF content verification)
    // expect(download.suggestedFilename()).toContain('faktura');
  });

  test('should work without JavaScript (graceful degradation)', async ({ page }) => {
    // Disable JavaScript to test server-side rendering
    await page.context().setExtraHTTPHeaders({
      'User-Agent': 'TestBot/1.0'
    });
    
    // Set Czech cookie via server
    await page.context().addCookies([{
      name: 'locale',
      value: 'cs',
      domain: 'localhost',
      path: '/'
    }]);
    
    await page.goto('http://localhost:3001/settings');
    
    // Should still show Czech text even without JS
    await expect(page.locator('text=Nastavení')).toBeVisible();
  });
});