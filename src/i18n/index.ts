import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import messages from './local/index';

/**
 * Supported languages configuration
 */
export const supportedLanguages = [
  { code: 'en', name: 'English', flag: '🇺🇸', dir: 'ltr' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', dir: 'ltr' },
] as const;

export type SupportedLanguageCode = typeof supportedLanguages[number]['code'];

/**
 * Normalize language code to supported format
 * Converts 'en-US' to 'en', 'fr-FR' to 'fr', etc.
 */
export const normalizeLanguageCode = (lng: string): SupportedLanguageCode => {
  const baseCode = lng.split('-')[0].toLowerCase();
  const isSupported = supportedLanguages.some(l => l.code === baseCode);
  return isSupported ? (baseCode as SupportedLanguageCode) : 'en';
};

/**
 * LocalStorage key for language preference
 */
const LANGUAGE_STORAGE_KEY = 'suji_language_preference';

/**
 * Get stored language preference
 */
export const getStoredLanguage = (): SupportedLanguageCode | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored) {
      const normalized = normalizeLanguageCode(stored);
      if (supportedLanguages.some(l => l.code === normalized)) {
        return normalized;
      }
    }
    // Also check i18next's storage
    const i18nextStored = localStorage.getItem('i18nextLng');
    if (i18nextStored) {
      const normalized = normalizeLanguageCode(i18nextStored);
      if (supportedLanguages.some(l => l.code === normalized)) {
        return normalized;
      }
    }
  } catch {
    // localStorage not available
  }
  return null;
};

/**
 * Store language preference
 */
export const setStoredLanguage = (lang: SupportedLanguageCode): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    localStorage.setItem('i18nextLng', lang);
  } catch {
    // localStorage not available
  }
};

/**
 * Get browser language
 */
export const getBrowserLanguage = (): SupportedLanguageCode => {
  if (typeof navigator === 'undefined') return 'en';
  const browserLang = navigator.language || (navigator as any).userLanguage || 'en';
  return normalizeLanguageCode(browserLang);
};

/**
 * Update HTML document attributes when language changes
 * - Sets the lang attribute for accessibility and SEO
 * - Sets the dir attribute for RTL language support
 */
const updateDocumentLanguage = (lng: string) => {
  if (typeof document !== 'undefined') {
    // Normalize language code
    const normalizedLang = normalizeLanguageCode(lng);
    
    // Set the lang attribute on the html element
    document.documentElement.lang = normalizedLang;
    
    // Find the language config to get direction
    const langConfig = supportedLanguages.find(l => l.code === normalizedLang);
    const dir = langConfig?.dir || 'ltr';
    
    // Set the dir attribute for RTL support
    document.documentElement.dir = dir;
    
    // Update meta tag for content language
    let metaLang = document.querySelector('meta[http-equiv="content-language"]');
    if (!metaLang) {
      metaLang = document.createElement('meta');
      metaLang.setAttribute('http-equiv', 'content-language');
      document.head.appendChild(metaLang);
    }
    metaLang.setAttribute('content', normalizedLang);
    
    // Store the language preference
    setStoredLanguage(normalizedLang);
  }
};

// Get initial language: stored preference > browser language > default 'en'
const getInitialLanguage = (): SupportedLanguageCode => {
  const stored = getStoredLanguage();
  if (stored) return stored;
  
  const browser = getBrowserLanguage();
  if (supportedLanguages.some(l => l.code === browser)) {
    return browser;
  }
  
  return 'en';
};

const initialLanguage = getInitialLanguage();

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: initialLanguage,
    fallbackLng: 'en',
    debug: false,
    resources: messages,
    supportedLngs: supportedLanguages.map(l => l.code),
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    load: 'languageOnly', // Only load 'en' not 'en-US'
  });

// Set initial document language
updateDocumentLanguage(i18n.language);

// Listen for language changes and update document
i18n.on('languageChanged', (lng) => {
  updateDocumentLanguage(lng);
});

// Also listen for initialization to ensure correct language is set
i18n.on('initialized', () => {
  const currentLang = i18n.language;
  const normalized = normalizeLanguageCode(currentLang);
  if (currentLang !== normalized) {
    i18n.changeLanguage(normalized);
  }
  updateDocumentLanguage(normalized);
});

export default i18n;