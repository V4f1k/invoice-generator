import '@testing-library/jest-dom';

// Fully mock next-intl (avoid importing ESM module in Jest)
jest.mock('next-intl', () => {
  return {
    // Simple passthrough provider
    NextIntlClientProvider: ({ children }) => children,
    useTranslations: (namespace = '') => (key) =>
      (namespace ? `${namespace}.${key}` : key),
    useLocale: () => 'en',
    useFormatter: () => ({
      dateTime: (date) => new Date(date).toLocaleDateString(),
      number: (num, opts) => (opts?.style === 'currency' ? `$${num}` : String(num)),
    }),
  };
});

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

// Mock navigation APIs that jsdom doesn't implement
try {
  Object.defineProperty(window, 'location', {
    value: {
      ...window.location,
      assign: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
    },
    writable: true,
  });
} catch {}

// Shim ResizeObserver used by Radix UI
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-expect-error ResizeObserver is not defined in test environment
global.ResizeObserver = global.ResizeObserver || MockResizeObserver;
