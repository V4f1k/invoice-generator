import { readFileSync } from 'fs';
import { join } from 'path';

type TranslationKey = string;
type Translations = { [key: string]: any };

class I18n {
  private translations: Map<string, Translations> = new Map();

  constructor() {
    // Load translation files
    this.loadTranslations();
  }

  private loadTranslations(): void {
    const locales = ['en', 'cs'];
    
    for (const locale of locales) {
      try {
        const filePath = join(__dirname, '..', 'translations', `${locale}.json`);
        const content = readFileSync(filePath, 'utf-8');
        const translations = JSON.parse(content);
        this.translations.set(locale, translations);
      } catch (error) {
        console.error(`Failed to load translations for locale ${locale}:`, error);
        // Fallback to empty object if translation file fails to load
        this.translations.set(locale, {});
      }
    }
  }

  public translate(locale: string, key: TranslationKey, fallback?: string): string {
    const translations = this.translations.get(locale) || this.translations.get('en') || {};
    
    // Navigate through nested keys (e.g., 'invoice.title')
    const keyParts = key.split('.');
    let value: any = translations;
    
    for (const part of keyParts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        value = undefined;
        break;
      }
    }
    
    // Return the translation, fallback, or the key itself
    return typeof value === 'string' ? value : (fallback || key);
  }

  public getTranslations(locale: string): Translations {
    return this.translations.get(locale) || this.translations.get('en') || {};
  }
}

// Create a singleton instance
export const i18n = new I18n();

// Export the translate function for easy use
export const t = (locale: string, key: TranslationKey, fallback?: string): string => {
  return i18n.translate(locale, key, fallback);
};