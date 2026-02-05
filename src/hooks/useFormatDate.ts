import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Locale mapping for date formatting
 * Maps i18n language codes to Intl locale codes
 */
const localeMap: Record<string, string> = {
  'en': 'en-NG',
  'en-US': 'en-US',
  'en-GB': 'en-GB',
  'en-NG': 'en-NG',
  'fr': 'fr-FR',
  'fr-FR': 'fr-FR',
};

/**
 * Default locale for fallback
 */
const DEFAULT_LOCALE = 'en-NG';

/**
 * Custom hook for locale-aware date formatting
 * Automatically updates when the i18n language changes
 * 
 * @returns Object with date formatting functions
 * 
 * @example
 * ```tsx
 * const { formatDate, formatDateTime, formatRelativeTime } = useFormatDate();
 * 
 * // Format a date
 * formatDate(new Date()); // "January 24, 2026" (en) or "24 janvier 2026" (fr)
 * 
 * // Format with custom options
 * formatDate(new Date(), { dateStyle: 'short' }); // "1/24/26" (en) or "24/01/26" (fr)
 * 
 * // Format relative time
 * formatRelativeTime(new Date(Date.now() - 86400000)); // "yesterday" (en) or "hier" (fr)
 * ```
 */
export function useFormatDate() {
  const { i18n } = useTranslation();
  
  /**
   * Get the current locale based on i18n language
   */
  const currentLocale = useMemo(() => {
    return localeMap[i18n.language] || DEFAULT_LOCALE;
  }, [i18n.language]);

  /**
   * Format a date value with locale-aware formatting
   * 
   * @param date - The date to format (Date, string, or number)
   * @param options - Optional Intl.DateTimeFormatOptions
   * @returns Formatted date string
   */
  const formatDate = useCallback((
    date: Date | string | number,
    options?: Intl.DateTimeFormatOptions
  ): string => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date provided to formatDate:', date);
        return '-';
      }

      const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...options,
      };

      return new Intl.DateTimeFormat(currentLocale, defaultOptions).format(dateObj);
    } catch (error) {
      console.warn('Date formatting failed:', error);
      return String(date);
    }
  }, [currentLocale]);

  /**
   * Format a date with time
   * 
   * @param date - The date to format
   * @param options - Optional Intl.DateTimeFormatOptions
   * @returns Formatted date and time string
   */
  const formatDateTime = useCallback((
    date: Date | string | number,
    options?: Intl.DateTimeFormatOptions
  ): string => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date provided to formatDateTime:', date);
        return '-';
      }

      const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        ...options,
      };

      return new Intl.DateTimeFormat(currentLocale, defaultOptions).format(dateObj);
    } catch (error) {
      console.warn('DateTime formatting failed:', error);
      return String(date);
    }
  }, [currentLocale]);

  /**
   * Format a date as a short date (e.g., "1/24/26" or "24/01/26")
   * 
   * @param date - The date to format
   * @returns Formatted short date string
   */
  const formatShortDate = useCallback((
    date: Date | string | number
  ): string => {
    return formatDate(date, {
      year: '2-digit',
      month: 'numeric',
      day: 'numeric',
    });
  }, [formatDate]);

  /**
   * Format a date as medium date (e.g., "Jan 24, 2026" or "24 janv. 2026")
   * 
   * @param date - The date to format
   * @returns Formatted medium date string
   */
  const formatMediumDate = useCallback((
    date: Date | string | number
  ): string => {
    return formatDate(date, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, [formatDate]);

  /**
   * Format time only
   * 
   * @param date - The date to extract time from
   * @param options - Optional time format options
   * @returns Formatted time string
   */
  const formatTime = useCallback((
    date: Date | string | number,
    options?: Intl.DateTimeFormatOptions
  ): string => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      
      if (isNaN(dateObj.getTime())) {
        return '-';
      }

      const defaultOptions: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        ...options,
      };

      return new Intl.DateTimeFormat(currentLocale, defaultOptions).format(dateObj);
    } catch (error) {
      console.warn('Time formatting failed:', error);
      return '-';
    }
  }, [currentLocale]);

  /**
   * Format a date as relative time (e.g., "2 days ago", "yesterday")
   * 
   * @param date - The date to format relative to now
   * @param options - Optional RelativeTimeFormat options
   * @returns Formatted relative time string
   */
  const formatRelativeTime = useCallback((
    date: Date | string | number,
    options?: Intl.RelativeTimeFormatOptions
  ): string => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      
      if (isNaN(dateObj.getTime())) {
        return '-';
      }

      const rtf = new Intl.RelativeTimeFormat(currentLocale, {
        numeric: 'auto',
        ...options,
      });

      const now = Date.now();
      const diff = dateObj.getTime() - now;
      const diffInSeconds = Math.round(diff / 1000);
      const diffInMinutes = Math.round(diff / (1000 * 60));
      const diffInHours = Math.round(diff / (1000 * 60 * 60));
      const diffInDays = Math.round(diff / (1000 * 60 * 60 * 24));
      const diffInWeeks = Math.round(diff / (1000 * 60 * 60 * 24 * 7));
      const diffInMonths = Math.round(diff / (1000 * 60 * 60 * 24 * 30));
      const diffInYears = Math.round(diff / (1000 * 60 * 60 * 24 * 365));

      // Choose the most appropriate unit
      if (Math.abs(diffInSeconds) < 60) {
        return rtf.format(diffInSeconds, 'second');
      } else if (Math.abs(diffInMinutes) < 60) {
        return rtf.format(diffInMinutes, 'minute');
      } else if (Math.abs(diffInHours) < 24) {
        return rtf.format(diffInHours, 'hour');
      } else if (Math.abs(diffInDays) < 7) {
        return rtf.format(diffInDays, 'day');
      } else if (Math.abs(diffInWeeks) < 4) {
        return rtf.format(diffInWeeks, 'week');
      } else if (Math.abs(diffInMonths) < 12) {
        return rtf.format(diffInMonths, 'month');
      } else {
        return rtf.format(diffInYears, 'year');
      }
    } catch (error) {
      console.warn('Relative time formatting failed:', error);
      return formatDate(date);
    }
  }, [currentLocale, formatDate]);

  /**
   * Check if a date is today
   * 
   * @param date - The date to check
   * @returns True if the date is today
   */
  const isToday = useCallback((date: Date | string | number): boolean => {
    const dateObj = date instanceof Date ? date : new Date(date);
    const today = new Date();
    return (
      dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear()
    );
  }, []);

  /**
   * Check if a date is yesterday
   * 
   * @param date - The date to check
   * @returns True if the date is yesterday
   */
  const isYesterday = useCallback((date: Date | string | number): boolean => {
    const dateObj = date instanceof Date ? date : new Date(date);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return (
      dateObj.getDate() === yesterday.getDate() &&
      dateObj.getMonth() === yesterday.getMonth() &&
      dateObj.getFullYear() === yesterday.getFullYear()
    );
  }, []);

  return {
    formatDate,
    formatDateTime,
    formatShortDate,
    formatMediumDate,
    formatTime,
    formatRelativeTime,
    isToday,
    isYesterday,
    currentLocale,
    currentLanguage: i18n.language,
  };
}

export default useFormatDate;
