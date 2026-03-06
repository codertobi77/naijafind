import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * DeepL API response type
 */
interface DeepLTranslationResponse {
  translations: Array<{
    detected_source_language?: string;
    text: string;
  }>;
}

/**
 * Supported target languages for DeepL
 * Maps our language codes to DeepL language codes
 * Note: Using simplified codes for DeepL Free API compatibility
 */
const DEEPL_TARGET_LANG_MAP: Record<string, string> = {
  en: "EN",
  fr: "FR",
  de: "DE",
  es: "ES",
  it: "IT",
  pt: "PT",
  nl: "NL",
  pl: "PL",
  ru: "RU",
  ja: "JA",
  zh: "ZH",
};

/**
 * Supported source languages for DeepL
 * DeepL supports fewer languages as source than target
 */
const DEEPL_SOURCE_LANG_MAP: Record<string, string> = {
  en: "EN",
  fr: "FR",
  de: "DE",
  es: "ES",
  it: "IT",
  pt: "PT",
  nl: "NL",
  pl: "PL",
  ru: "RU",
  ja: "JA",
  zh: "ZH",
};

/**
 * Action to translate text using DeepL API
 * Called directly from the frontend for dynamic text translation
 */
export const translateText = action({
  args: {
    text: v.string(),
    targetLang: v.string(),
    sourceLang: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const DEEPL_API_KEY = process.env.DEEPL_API_KEY;

    if (!DEEPL_API_KEY) {
      console.error("DEEPL_API_KEY not configured");
      return {
        success: false,
        error: "Translation service not configured",
        translatedText: null,
      };
    }

    // Map our language code to DeepL format
    const deeplTargetLang = DEEPL_TARGET_LANG_MAP[args.targetLang] || args.targetLang.toUpperCase();
    const deeplSourceLang = args.sourceLang && DEEPL_SOURCE_LANG_MAP[args.sourceLang]
      ? DEEPL_SOURCE_LANG_MAP[args.sourceLang]
      : undefined;

    console.log("DeepL translate request:", {
      text: args.text?.substring(0, 50),
      targetLang: args.targetLang,
      deeplTargetLang,
      sourceLang: args.sourceLang,
      deeplSourceLang,
    });

    try {
      const requestBody = {
        text: [args.text],
        target_lang: deeplTargetLang,
        ...(deeplSourceLang && { source_lang: deeplSourceLang }),
      };

      console.log("DeepL request body:", JSON.stringify(requestBody));

      const response = await fetch("https://api-free.deepl.com/v2/translate", {
        method: "POST",
        headers: {
          "Authorization": `DeepL-Auth-Key ${DEEPL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("DeepL API error:", response.status, errorText);
        return {
          success: false,
          error: `DeepL API error: ${response.status} - ${errorText}`,
          translatedText: null,
        };
      }

      const data: DeepLTranslationResponse = await response.json();

      if (!data.translations || data.translations.length === 0) {
        return {
          success: false,
          error: "No translation returned",
          translatedText: null,
        };
      }

      return {
        success: true,
        translatedText: data.translations[0].text,
        detectedSourceLanguage: data.translations[0].detected_source_language,
      };
    } catch (error) {
      console.error("Translation failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        translatedText: null,
      };
    }
  },
});

/**
 * Action to translate multiple texts at once (batch translation)
 * More efficient for translating multiple strings
 */
export const translateBatch = action({
  args: {
    texts: v.array(v.string()),
    targetLang: v.string(),
    sourceLang: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const DEEPL_API_KEY = process.env.DEEPL_API_KEY;

    if (!DEEPL_API_KEY) {
      console.error("DEEPL_API_KEY not configured");
      return {
        success: false,
        error: "Translation service not configured",
        translations: null,
      };
    }

    const deeplTargetLang = DEEPL_TARGET_LANG_MAP[args.targetLang] || args.targetLang.toUpperCase();
    const deeplSourceLang = args.sourceLang && DEEPL_SOURCE_LANG_MAP[args.sourceLang]
      ? DEEPL_SOURCE_LANG_MAP[args.sourceLang]
      : undefined;

    try {
      const requestBody = {
        text: args.texts,
        target_lang: deeplTargetLang,
        ...(deeplSourceLang && { source_lang: deeplSourceLang }),
      };

      const response = await fetch("https://api-free.deepl.com/v2/translate", {
        method: "POST",
        headers: {
          "Authorization": `DeepL-Auth-Key ${DEEPL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("DeepL API error:", errorText);
        return {
          success: false,
          error: `DeepL API error: ${response.status}`,
          translations: null,
        };
      }

      const data: DeepLTranslationResponse = await response.json();

      return {
        success: true,
        translations: data.translations.map((t) => ({
          translatedText: t.text,
          detectedSourceLanguage: t.detected_source_language,
        })),
      };
    } catch (error) {
      console.error("Batch translation failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        translations: null,
      };
    }
  },
});

/**
 * Action to detect the language of a text
 */
export const detectLanguage = action({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const DEEPL_API_KEY = process.env.DEEPL_API_KEY;

    if (!DEEPL_API_KEY) {
      return {
        success: false,
        error: "Translation service not configured",
        detectedLanguage: null,
      };
    }

    try {
      const requestBody = {
        text: [args.text],
        target_lang: "EN",
      };

      const response = await fetch("https://api-free.deepl.com/v2/translate", {
        method: "POST",
        headers: {
          "Authorization": `DeepL-Auth-Key ${DEEPL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        return {
          success: false,
          error: "Language detection failed",
          detectedLanguage: null,
        };
      }

      const data: DeepLTranslationResponse = await response.json();

      return {
        success: true,
        detectedLanguage: data.translations[0]?.detected_source_language || null,
      };
    } catch (error) {
      console.error("Language detection failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        detectedLanguage: null,
      };
    }
  },
});
