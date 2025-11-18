import i18n from '../i18n';

// Define currency configurations for different locales
const currencyConfig: Record<string, { currency: string; locale: string }> = {
  'en': { currency: 'NGN', locale: 'en-NG' },  // English Nigeria
  'fr': { currency: 'NGN', locale: 'fr-FR' },  // French Nigeria (using French locale for formatting)
  'en-NG': { currency: 'NGN', locale: 'en-NG' },
  'fr-FR': { currency: 'NGN', locale: 'fr-FR' },
};

// Default configuration for fallback
const defaultConfig = { currency: 'NGN', locale: 'en-NG' };

/**
 * Format a monetary value with appropriate currency symbol and formatting
 * based on the current i18n language
 * 
 * @param amount - The monetary amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  const currentLanguage = i18n.language;
  const config = currencyConfig[currentLanguage] || defaultConfig;
  
  try {
    // Format the currency using Intl.NumberFormat
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback to simple formatting if Intl fails
    console.warn('Currency formatting failed, using fallback:', error);
    return `₦${amount.toFixed(2)}`;
  }
}

/**
 * Get currency symbol for the current locale
 * 
 * @returns Currency symbol
 */
export function getCurrencySymbol(): string {
  const currentLanguage = i18n.language;
  const config = currencyConfig[currentLanguage] || defaultConfig;
  
  try {
    // Get currency symbol using Intl.NumberFormat
    const formatter = new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    
    // Extract symbol from formatted value (e.g., "₦1" -> "₦")
    const parts = formatter.formatToParts(1);
    const currencyPart = parts.find(part => part.type === 'currency');
    return currencyPart ? currencyPart.value : '₦';
  } catch (error) {
    // Fallback to Naira symbol
    console.warn('Could not determine currency symbol, using fallback:', error);
    return '₦';
  }
}

export default { formatCurrency, getCurrencySymbol };