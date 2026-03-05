import { useCallback, useEffect, useRef, useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import i18n, { SupportedLanguageCode } from "../i18n";

/**
 * Cache entry for translations
 */
interface TranslationCache {
  [key: string]: {
    translatedText: string;
    timestamp: number;
  };
}

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_KEY_PREFIX = "deepl_translation_cache_";

/**
 * Generate a cache key for a translation
 */
const getCacheKey = (text: string, targetLang: string): string => {
  // Simple hash function for the text
  const textHash = text
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0)
    .toString();
  return `${textHash}_${targetLang}`;
};

/**
 * Get cached translation if valid
 */
const getCachedTranslation = (text: string, targetLang: string): string | null => {
  try {
    const cacheKey = getCacheKey(text, targetLang);
    const fullKey = CACHE_KEY_PREFIX + cacheKey;
    const cached = localStorage.getItem(fullKey);

    if (cached) {
      const parsed: { translatedText: string; timestamp: number } = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_DURATION_MS) {
        return parsed.translatedText;
      }
      // Expired, remove it
      localStorage.removeItem(fullKey);
    }
  } catch {
    // localStorage not available or parsing error
  }
  return null;
};

/**
 * Save translation to cache
 */
const setCachedTranslation = (text: string, targetLang: string, translatedText: string): void => {
  try {
    const cacheKey = getCacheKey(text, targetLang);
    const fullKey = CACHE_KEY_PREFIX + cacheKey;
    const cacheEntry = {
      translatedText,
      timestamp: Date.now(),
    };
    localStorage.setItem(fullKey, JSON.stringify(cacheEntry));
  } catch {
    // localStorage not available
  }
};

/**
 * Hook for translating dynamic text using DeepL
 *
 * Usage:
 * ```tsx
 * const { translate, translateBatch, isTranslating } = useDeepLTranslation();
 *
 * // Single translation
 * const translated = await translate("Hello world", "fr");
 *
 * // Batch translation
 * const translations = await translateBatch(["Text 1", "Text 2"], "fr");
 * ```
 */
export const useDeepLTranslation = () => {
  const translateAction = useAction(api.translation.translateText);
  const translateBatchAction = useAction(api.translation.translateBatch);
  const detectLanguageAction = useAction(api.translation.detectLanguage);

  const [isTranslating, setIsTranslating] = useState(false);
  const pendingRequests = useRef<Set<string>>(new Set());

  /**
   * Translate a single text
   */
  const translate = useCallback(
    async (
      text: string,
      targetLang: SupportedLanguageCode,
      sourceLang?: SupportedLanguageCode
    ): Promise<string | null> => {
      if (!text || text.trim() === "") {
        return text;
      }

      // Check cache first
      const cached = getCachedTranslation(text, targetLang);
      if (cached) {
        return cached;
      }

      const requestKey = `${text}_${targetLang}_${sourceLang || "auto"}`;

      // Avoid duplicate concurrent requests
      if (pendingRequests.current.has(requestKey)) {
        return null;
      }

      pendingRequests.current.add(requestKey);
      setIsTranslating(true);

      try {
        const result = await translateAction({
          text,
          targetLang,
          sourceLang,
        });

        if (result.success && result.translatedText) {
          // Cache the result
          setCachedTranslation(text, targetLang, result.translatedText);
          return result.translatedText;
        }

        console.warn("Translation failed:", result.error);
        return null;
      } catch (error) {
        console.error("Translation error:", error);
        return null;
      } finally {
        pendingRequests.current.delete(requestKey);
        if (pendingRequests.current.size === 0) {
          setIsTranslating(false);
        }
      }
    },
    [translateAction]
  );

  /**
   * Translate multiple texts at once
   */
  const translateBatch = useCallback(
    async (
      texts: string[],
      targetLang: SupportedLanguageCode,
      sourceLang?: SupportedLanguageCode
    ): Promise<Array<{ original: string; translated: string | null }>> => {
      if (!texts.length) {
        return [];
      }

      // Check cache for each text
      const uncachedTexts: string[] = [];
      const uncachedIndices: number[] = [];
      const results: Array<{ original: string; translated: string | null }> = texts.map(
        (text) => ({
          original: text,
          translated: getCachedTranslation(text, targetLang),
        })
      );

      results.forEach((result, index) => {
        if (result.translated === null) {
          uncachedTexts.push(result.original);
          uncachedIndices.push(index);
        }
      });

      // If all texts are cached, return immediately
      if (uncachedTexts.length === 0) {
        return results;
      }

      setIsTranslating(true);

      try {
        const batchResult = await translateBatchAction({
          texts: uncachedTexts,
          targetLang,
          sourceLang,
        });

        if (batchResult.success && batchResult.translations) {
          batchResult.translations.forEach((translation, idx) => {
            const originalIndex = uncachedIndices[idx];
            const originalText = uncachedTexts[idx];
            results[originalIndex].translated = translation.translatedText;

            // Cache each translation
            setCachedTranslation(
              originalText,
              targetLang,
              translation.translatedText
            );
          });
        }

        return results;
      } catch (error) {
        console.error("Batch translation error:", error);
        return results;
      } finally {
        setIsTranslating(false);
      }
    },
    [translateBatchAction]
  );

  /**
   * Detect the language of a text
   */
  const detectLanguage = useCallback(
    async (text: string): Promise<string | null> => {
      if (!text || text.trim() === "") {
        return null;
      }

      try {
        const result = await detectLanguageAction({ text });
        return result.success ? result.detectedLanguage : null;
      } catch (error) {
        console.error("Language detection error:", error);
        return null;
      }
    },
    [detectLanguageAction]
  );

  /**
   * Clear the translation cache
   */
  const clearCache = useCallback((): void => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_KEY_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch {
      // localStorage not available
    }
  }, []);

  return {
    translate,
    translateBatch,
    detectLanguage,
    isTranslating,
    clearCache,
  };
};

/**
 * Hook for auto-translating content when language changes
 * Useful for dynamic content like supplier descriptions
 *
 * Usage:
 * ```tsx
 * const { translatedText, isLoading } = useAutoTranslation(
 *   supplier.description,
 *   shouldTranslate // only translate when this is true
 * );
 * ```
 */
export const useAutoTranslation = (
  text: string | null | undefined,
  enabled: boolean = true
) => {
  const { translate, isTranslating } = useDeepLTranslation();
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const currentLanguage = i18n.language as SupportedLanguageCode;
  const prevLanguageRef = useRef<string>(currentLanguage);
  const originalTextRef = useRef<string | null>(null);

  useEffect(() => {
    // Store the original text on first render
    if (originalTextRef.current === null && text) {
      originalTextRef.current = text;
    }
  }, [text]);

  useEffect(() => {
    const performTranslation = async () => {
      if (!enabled || !text) {
        setTranslatedText(null);
        return;
      }

      // If language changed back to original, show original text
      const originalLang: SupportedLanguageCode = "en"; // Default source language
      if (currentLanguage === originalLang) {
        setTranslatedText(null);
        return;
      }

      const result = await translate(text, currentLanguage, originalLang);
      setTranslatedText(result);
    };

    // Only translate when language changes or text changes
    if (currentLanguage !== prevLanguageRef.current || text !== originalTextRef.current) {
      performTranslation();
      prevLanguageRef.current = currentLanguage;
    }
  }, [text, currentLanguage, enabled, translate]);

  return {
    translatedText: translatedText || text,
    originalText: text,
    isLoading: isTranslating,
    isTranslated: translatedText !== null && translatedText !== text,
  };
};

/**
 * Component for displaying translated text
 * Shows original on hover or with a toggle
 *
 * Usage:
 * ```tsx
 * <TranslatableText text={description} showToggle />
 * ```
 */
export const useTranslatableText = () => {
  const [showOriginal, setShowOriginal] = useState(false);
  const { translate, isTranslating } = useDeepLTranslation();
  const [translation, setTranslation] = useState<string | null>(null);
  const currentLanguage = i18n.language as SupportedLanguageCode;

  const getTranslatedText = useCallback(
    async (text: string) => {
      if (!text) return null;

      // Don't translate if already in target language
      if (currentLanguage === "en") {
        return null;
      }

      const result = await translate(text, currentLanguage, "en");
      return result;
    },
    [translate, currentLanguage]
  );

  const toggleOriginal = useCallback(() => {
    setShowOriginal((prev) => !prev);
  }, []);

  return {
    showOriginal,
    toggleOriginal,
    getTranslatedText,
    isTranslating,
    setTranslation,
    translation,
  };
};
