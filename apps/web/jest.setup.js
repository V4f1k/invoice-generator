import '@testing-library/jest-dom';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: (namespace = '') => (key) => {
    // Simple mock that returns the key for testing
    return namespace ? `${namespace}.${key}` : key;
  },
  useLocale: () => 'en',
  useFormatter: () => ({
    dateTime: (date) => new Date(date).toLocaleDateString(),
    number: (num, opts) => {
      if (opts?.style === 'currency') {
        return `$${num}`;
      }
      return String(num);
    }
  })
}));

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

// Mock window.location.reload only if it exists
if (window.location && typeof window.location.reload === 'undefined') {
  window.location.reload = jest.fn();
}