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

// Mock window.location.reload
const mockReload = jest.fn();
delete window.location;
window.location = { reload: mockReload };

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
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('shows Czech language when locale is cs', () => {
    render(<MockedLanguageSwitcher locale="cs" />);
    expect(screen.getByText('Čeština')).toBeInTheDocument();
  });

  it('opens dropdown menu when clicked', async () => {
    render(<MockedLanguageSwitcher />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('Čeština')).toBeInTheDocument();
    });
  });

  it('changes language and reloads page when option is selected', async () => {
    render(<MockedLanguageSwitcher />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      const czechOption = screen.getAllByText('Čeština')[1]; // Second one is in dropdown
      fireEvent.click(czechOption);
    });
    
    expect(document.cookie).toContain('locale=cs');
    expect(mockReload).toHaveBeenCalled();
  });

  it('displays correct language name based on current locale', () => {
    render(<MockedLanguageSwitcher locale="cs" />);
    expect(screen.getByText('Čeština')).toBeInTheDocument();
    
    // Re-render with English
    render(<MockedLanguageSwitcher locale="en" />);
    expect(screen.getByText('English')).toBeInTheDocument();
  });
});