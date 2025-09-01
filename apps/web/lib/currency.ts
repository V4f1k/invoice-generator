import { Locale } from '@/app/lib/locale-provider';

export interface CurrencyOptions {
  locale: Locale;
  amount: number;
}

export function formatCurrency({ locale, amount }: CurrencyOptions): string {
  if (locale === 'cs') {
    // Czech Republic - Czech Koruna
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
    }).format(amount);
  } else {
    // Default - US Dollar
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }
}

export function getCurrencySymbol(locale: Locale): string {
  return locale === 'cs' ? 'Kč' : '$';
}