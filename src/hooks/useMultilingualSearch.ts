import { useCallback, useEffect, useRef, useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import i18n, { SupportedLanguageCode, getStoredLanguage, supportedLanguages } from "../i18n";

/**
 * Cache for search translations (Alibaba-style)
 * Key: query_language -> Value: translated query
 */
interface SearchTranslationCache {
  [key: string]: {
    translatedQuery: string;
    detectedLanguage: string;
    timestamp: number;
  };
}

const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Generate cache key for search translation
 */
const getSearchCacheKey = (query: string, targetLang: string): string => {
  return `${query.toLowerCase().trim()}_${targetLang}`;
};

/**
 * Hook for Alibaba-style multilingual search
 * Automatically translates search queries to match content language (English)
 * and translates results back to user's language
 *
 * Usage:
 * ```tsx
 * const { translateQuery, translateResults, isTranslating } = useMultilingualSearch();
 *
 * // Translate user query to English for searching
 * const searchQuery = await translateQuery(userInput);
 *
 * // Translate search results back to user's language
 * const translatedResults = await translateResults(results);
 * ```
 */
export const useMultilingualSearch = () => {
  const translateAction = useAction(api.translation.translateText);
  const translateBatchAction = useAction(api.translation.translateBatch);
  const detectLanguageAction = useAction(api.translation.detectLanguage);

  const [isTranslating, setIsTranslating] = useState(false);
  const cacheRef = useRef<SearchTranslationCache>({});
  const currentLanguage = i18n.language as SupportedLanguageCode;

  /**
   * Translate search query from user's language to English (content language)
   * This enables searching in any language while content is in English
   */
  const translateQuery = useCallback(
    async (
      query: string,
      options?: {
        skipIfEnglish?: boolean;
        detectSourceLang?: boolean;
      }
    ): Promise<{
      translatedQuery: string;
      detectedLanguage: string;
      wasTranslated: boolean;
    }> => {
      if (!query || query.trim() === "") {
        return {
          translatedQuery: "",
          detectedLanguage: currentLanguage,
          wasTranslated: false,
        };
      }

      const trimmedQuery = query.trim();

      // If query is already in English and skipIfEnglish is true
      if (options?.skipIfEnglish !== false && currentLanguage === "en") {
        return {
          translatedQuery: trimmedQuery,
          detectedLanguage: "en",
          wasTranslated: false,
        };
      }

      // Check cache first
      const cacheKey = getSearchCacheKey(trimmedQuery, "en");
      const cached = cacheRef.current[cacheKey];
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
        return {
          translatedQuery: cached.translatedQuery,
          detectedLanguage: cached.detectedLanguage,
          wasTranslated: true,
        };
      }

      setIsTranslating(true);

      try {
        let detectedLang: string = currentLanguage;

        // Detect source language if requested
        if (options?.detectSourceLang) {
          const detectResult = await detectLanguageAction({ text: trimmedQuery });
          if (detectResult.success && detectResult.detectedLanguage) {
            detectedLang = detectResult.detectedLanguage.toLowerCase();
          }
        }

        // If detected language is English, no need to translate
        if (detectedLang === "en") {
          return {
            translatedQuery: trimmedQuery,
            detectedLanguage: "en",
            wasTranslated: false,
          };
        }

        // Translate to English
        const result = await translateAction({
          text: trimmedQuery,
          targetLang: "en",
          sourceLang: detectedLang !== "en" ? detectedLang : undefined,
        });

        if (result.success && result.translatedText) {
          // Cache the result
          cacheRef.current[cacheKey] = {
            translatedQuery: result.translatedText,
            detectedLanguage: detectedLang,
            timestamp: Date.now(),
          };

          return {
            translatedQuery: result.translatedText,
            detectedLanguage: detectedLang,
            wasTranslated: true,
          };
        }

        // Fallback: return original query if translation fails
        return {
          translatedQuery: trimmedQuery,
          detectedLanguage: detectedLang,
          wasTranslated: false,
        };
      } catch (error) {
        console.error("Query translation error:", error);
        return {
          translatedQuery: trimmedQuery,
          detectedLanguage: currentLanguage,
          wasTranslated: false,
        };
      } finally {
        setIsTranslating(false);
      }
    },
    [currentLanguage, translateAction, detectLanguageAction]
  );

  /**
   * Translate search results from English to user's language
   * Useful for translating supplier names, categories, descriptions in results
   */
  const translateResults = useCallback(
    async <T extends Record<string, any>>(
      results: T[],
      fieldsToTranslate: (keyof T)[],
      options?: {
        batchSize?: number;
      }
    ): Promise<T[]> => {
      if (!results.length || currentLanguage === "en") {
        return results;
      }

      const batchSize = options?.batchSize || 10;
      setIsTranslating(true);

      try {
        // Collect all texts to translate
        const textsToTranslate: string[] = [];
        const textMapping: { resultIndex: number; field: keyof T; textIndex: number }[] = [];

        results.forEach((result, resultIndex) => {
          fieldsToTranslate.forEach((field) => {
            const value = result[field];
            if (typeof value === "string" && value.trim()) {
              textMapping.push({
                resultIndex,
                field,
                textIndex: textsToTranslate.length,
              });
              textsToTranslate.push(value);
            }
          });
        });

        if (textsToTranslate.length === 0) {
          return results;
        }

        // Translate in batches
        const translatedResults = [...results];
        for (let i = 0; i < textsToTranslate.length; i += batchSize) {
          const batch = textsToTranslate.slice(i, i + batchSize);
          const batchResult = await translateBatchAction({
            texts: batch,
            targetLang: currentLanguage,
            sourceLang: "en",
          });

          if (batchResult.success && batchResult.translations) {
            batchResult.translations.forEach((translation, idx) => {
              const globalIndex = i + idx;
              // Use direct indexing since textMapping is perfectly aligned with textsToTranslate
              const mapping = textMapping[globalIndex];
              if (mapping && translation.translatedText) {
                translatedResults[mapping.resultIndex] = {
                  ...translatedResults[mapping.resultIndex],
                  [mapping.field]: translation.translatedText,
                };
              }
            });
          }
        }

        return translatedResults;
      } catch (error) {
        console.error("Results translation error:", error);
        return results;
      } finally {
        setIsTranslating(false);
      }
    },
    [currentLanguage, translateBatchAction]
  );

  /**
   * Clear the search translation cache
   */
  const clearCache = useCallback(() => {
    cacheRef.current = {};
  }, []);

  return {
    translateQuery,
    translateResults,
    isTranslating,
    clearCache,
    currentLanguage,
  };
};

/**
 * Hook to initialize language preference on app load
 * Ensures language is loaded from localStorage or detected from browser
 */
export const useLanguageInit = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initialLanguage, setInitialLanguage] = useState<SupportedLanguageCode>("en");

  useEffect(() => {
    const initLanguage = () => {
      // Try to get stored language first
      const stored = getStoredLanguage();

      if (stored) {
        // Validate stored language is still supported
        const isSupported = supportedLanguages.some((l) => l.code === stored);
        if (isSupported && i18n.language !== stored) {
          i18n.changeLanguage(stored);
        }
        setInitialLanguage(stored);
      } else {
        // Use i18n's detected language
        const detectedLang = i18n.language.split("-")[0] as SupportedLanguageCode;
        const isSupported = supportedLanguages.some((l) => l.code === detectedLang);
        const finalLang = isSupported ? detectedLang : "en";

        if (i18n.language !== finalLang) {
          i18n.changeLanguage(finalLang);
        }
        setInitialLanguage(finalLang);
      }

      setIsInitialized(true);
    };

    // Wait for i18n to be ready
    if (i18n.isInitialized) {
      initLanguage();
    } else {
      i18n.on("initialized", initLanguage);
      // Fallback if already initialized
      setTimeout(initLanguage, 100);
    }

    return () => {
      i18n.off("initialized", initLanguage);
    };
  }, []);

  return { isInitialized, initialLanguage };
};

/**
 * Hook to sync language across tabs
 * When user changes language in one tab, all other tabs update
 */
export const useLanguageSync = () => {
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "suji_language_preference" || e.key === "i18nextLng") {
        const newLang = e.newValue;
        if (newLang && newLang !== i18n.language) {
          const isSupported = supportedLanguages.some((l) => l.code === newLang);
          if (isSupported) {
            i18n.changeLanguage(newLang);
          }
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);
};
