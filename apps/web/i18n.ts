import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

// Can be imported from a shared config
export const locales = ['en', 'cs'] as const;

export default getRequestConfig(async ({ locale }) => {
  // Try to get locale from cookie first
  const cookieStore = cookies();
  const cookieLocale = cookieStore.get('locale')?.value;

  // Use cookie locale if available; fallback to provided locale or 'en'
  const finalLocale = (cookieLocale || locale || 'en') as string;

  // Validate the locale
  const validLocale = locales.includes(finalLocale as (typeof locales)[number]) ? finalLocale : 'en';

  return {
    locale: validLocale,
    messages: (await import(`./messages/${validLocale}.json`)).default
  };
});
