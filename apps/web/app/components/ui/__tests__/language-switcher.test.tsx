/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { LanguageSwitcher } from '../language-switcher';
import { LocaleProvider } from '@/app/lib/locale-provider';
import enMessages from '../../../../messages/en.json';
import csMessages from '../../../../messages/cs.json';

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
});

const MockedLanguageSwitcher = ({ locale = 'en' }: { locale?: string }) => (
  <NextIntlClientProvider locale={locale} messages={locale === 'en' ? enMessages : csMessages}>
    <LocaleProvider>
      <LanguageSwitcher />
    </LocaleProvider>
  </NextIntlClientProvider>
);

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.cookie = '';
  });

  it('renders language switcher button', () => {
    render(<MockedLanguageSwitcher />);
    expect(screen.getByRole('button')).toBeInTheDocument();
    // Check for English text or fallback key
    expect(screen.getByText(/English|languages\.en/)).toBeInTheDocument();
  });

  it('shows Czech language when locale is cs', () => {
    render(<MockedLanguageSwitcher locale="cs" />);
    // Check for Czech text or fallback key
    expect(screen.getByText(/Čeština|languages\.cs/)).toBeInTheDocument();
  });

  it('opens dropdown menu when clicked', async () => {
    render(<MockedLanguageSwitcher />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      // Check that both language options appear in the dropdown
      expect(screen.getAllByText(/English|languages\.en/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Čeština|languages\.cs/).length).toBeGreaterThan(0);
    });
  });

  it('changes language and reloads page when option is selected', async () => {
    render(<MockedLanguageSwitcher />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const czechOptions = screen.getAllByText(/Čeština|languages\.cs/);
      // Click the second occurrence (dropdown option, not button text)
      if (czechOptions.length > 1) {
        fireEvent.click(czechOptions[1]);
      } else {
        fireEvent.click(czechOptions[0]);
      }
    });

    expect(document.cookie).toContain('locale=cs');
    expect(window.location.reload).toHaveBeenCalled();
  });

  it('displays correct language name based on current locale', () => {
    render(<MockedLanguageSwitcher locale="cs" />);
    expect(screen.getByText(/Čeština|languages\.cs/)).toBeInTheDocument();

    // Re-render with English
    render(<MockedLanguageSwitcher locale="en" />);
    expect(screen.getByText(/English|languages\.en/)).toBeInTheDocument();
  });
});
