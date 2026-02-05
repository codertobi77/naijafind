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
 * Update HTML document attributes when language changes
 * - Sets the lang attribute for accessibility and SEO
 * - Sets the dir attribute for RTL language support
 */
const updateDocumentLanguage = (lng: string) => {
  if (typeof document !== 'undefined') {
    // Set the lang attribute on the html element
    document.documentElement.lang = lng;
    
    // Find the language config to get direction
    const langConfig = supportedLanguages.find(l => l.code === lng);
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
    metaLang.setAttribute('content', lng);
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: 'en',
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
  });

// Set initial document language
updateDocumentLanguage(i18n.language);

// Listen for language changes and update document
i18n.on('languageChanged', (lng) => {
  updateDocumentLanguage(lng);
});

export default i18n;