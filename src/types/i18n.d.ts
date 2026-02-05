/**
 * TypeScript type definitions for i18next translations
 * 
 * This file provides type safety for translation keys across the application.
 * It enables autocomplete and compile-time checking for translation keys.
 * 
 * @see https://www.i18next.com/overview/typescript
 */

import 'i18next';

// Import all English translation modules as the source of truth
import type { common } from '../i18n/local/en/common';
import type { home } from '../i18n/local/en/home';
import type { auth } from '../i18n/local/en/auth';
import type { dashboard } from '../i18n/local/en/dashboard';
import type { supplier } from '../i18n/local/en/supplier';
import type { admin } from '../i18n/local/en/admin';
import type { search } from '../i18n/local/en/search';
import type { categories } from '../i18n/local/en/categories';
import type { faq } from '../i18n/local/en/faq';
import type { help } from '../i18n/local/en/help';
import type { contact } from '../i18n/local/en/contact';
import type { privacy } from '../i18n/local/en/privacy';
import type { about } from '../i18n/local/en/about';
import type { notfound } from '../i18n/local/en/notfound';

/**
 * Combined translation resources type
 * Merges all translation modules into a single type
 */
type TranslationResources = typeof common &
  typeof home &
  typeof auth &
  typeof dashboard &
  typeof supplier &
  typeof admin &
  typeof search &
  typeof categories &
  typeof faq &
  typeof help &
  typeof contact &
  typeof privacy &
  typeof about &
  typeof notfound;

/**
 * Extract all translation keys as a union type
 */
export type TranslationKey = keyof TranslationResources;

/**
 * Resources structure for i18next
 */
interface Resources {
  translation: TranslationResources;
}

/**
 * Extend i18next module with custom type options
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    /**
     * Default namespace used when not specified
     */
    defaultNS: 'translation';
    
    /**
     * Resources type for type-safe translations
     */
    resources: Resources;
    
    /**
     * Return type for translation function
     * Set to false to return string instead of union of all values
     */
    returnNull: false;
    returnEmptyString: false;
  }
}

/**
 * Helper type for translation function parameters
 * Use this when you need to type translation keys in function parameters
 * 
 * @example
 * ```tsx
 * function MyComponent({ titleKey }: { titleKey: TranslationKey }) {
 *   const { t } = useTranslation();
 *   return <h1>{t(titleKey)}</h1>;
 * }
 * ```
 */
export type TFunction = (key: TranslationKey, options?: Record<string, unknown>) => string;

/**
 * Namespace type for organizing translations
 */
export type TranslationNamespace = 
  | 'common'
  | 'home'
  | 'auth'
  | 'dashboard'
  | 'supplier'
  | 'admin'
  | 'search'
  | 'categories'
  | 'faq'
  | 'help'
  | 'contact'
  | 'privacy'
  | 'about'
  | 'notfound';

/**
 * Supported language codes
 */
export type SupportedLanguage = 'en' | 'fr';

/**
 * Language configuration type
 */
export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  flag: string;
  dir: 'ltr' | 'rtl';
}
