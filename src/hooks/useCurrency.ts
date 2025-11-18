import { useTranslation } from 'react-i18next';
import { formatCurrency, getCurrencySymbol } from '../lib/currency';

/**
 * Custom hook for currency formatting that integrates with i18n
 * Automatically updates when the language changes
 * 
 * @returns Object with currency formatting functions
 */
export function useCurrency() {
  const { i18n } = useTranslation();
  
  // Return the formatting functions
  return {
    /**
     * Format a monetary value with appropriate currency symbol and formatting
     * based on the current i18n language
     * 
     * @param amount - The monetary amount to format
     * @returns Formatted currency string
     */
    formatCurrency,
    
    /**
     * Get currency symbol for the current locale
     * 
     * @returns Currency symbol
     */
    getCurrencySymbol,
    
    /**
     * Current language code
     */
    currentLanguage: i18n.language,
  };
}

export default useCurrency;