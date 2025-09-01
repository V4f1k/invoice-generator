import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

// Can be imported from a shared config
export const locales = ['en', 'cs'] as const;

export default getRequestConfig(async ({ locale }) => {
  // Try to get locale from cookie first
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('locale')?.value;
  
  // Use cookie locale if available, otherwise use provided locale or default to 'en'
  const finalLocale = cookieLocale || locale || 'en';
  
  // Validate the locale
  const validLocale = locales.includes(finalLocale as any) ? finalLocale : 'en';

  return {
    locale: validLocale,
    messages: (await import(`./messages/${validLocale}.json`)).default
  };
});