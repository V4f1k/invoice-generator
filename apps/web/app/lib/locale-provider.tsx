'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Locale = 'en' | 'cs';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}

interface LocaleProviderProps {
  children: ReactNode;
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>('en');

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      // Set cookie for persistence across sessions
      document.cookie = `locale=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}`;
      // Trigger page reload to apply new locale
      window.location.reload();
    }
  };

  useEffect(() => {
    // Load saved locale from cookie
    if (typeof window !== 'undefined') {
      const cookieLocale = document.cookie
        .split('; ')
        .find(row => row.startsWith('locale='))
        ?.split('=')[1] as Locale;
      
      if (cookieLocale && (cookieLocale === 'en' || cookieLocale === 'cs')) {
        setLocaleState(cookieLocale);
      }
    }
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}