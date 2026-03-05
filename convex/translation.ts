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
 */
const DEEPL_LANGUAGE_MAP: Record<string, string> = {
  en: "EN-US",
  fr: "FR",
  de: "DE",
  es: "ES",
  it: "IT",
  pt: "PT-PT",
  nl: "NL",
  pl: "PL",
  ru: "RU",
  ja: "JA",
  zh: "ZH",
  ar: "AR",
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
    const deeplTargetLang = DEEPL_LANGUAGE_MAP[args.targetLang] || args.targetLang.toUpperCase();
    const deeplSourceLang = args.sourceLang
      ? (DEEPL_LANGUAGE_MAP[args.sourceLang] || args.sourceLang.toUpperCase())
      : undefined;

    try {
      const params = new URLSearchParams();
      params.append("text", args.text);
      params.append("target_lang", deeplTargetLang);
      if (deeplSourceLang) {
        params.append("source_lang", deeplSourceLang);
      }

      const response = await fetch("https://api-free.deepl.com/v2/translate", {
        method: "POST",
        headers: {
          "Authorization": `DeepL-Auth-Key ${DEEPL_API_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("DeepL API error:", errorText);
        return {
          success: false,
          error: `DeepL API error: ${response.status}`,
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

    const deeplTargetLang = DEEPL_LANGUAGE_MAP[args.targetLang] || args.targetLang.toUpperCase();
    const deeplSourceLang = args.sourceLang
      ? (DEEPL_LANGUAGE_MAP[args.sourceLang] || args.sourceLang.toUpperCase())
      : undefined;

    try {
      const params = new URLSearchParams();
      args.texts.forEach((text) => params.append("text", text));
      params.append("target_lang", deeplTargetLang);
      if (deeplSourceLang) {
        params.append("source_lang", deeplSourceLang);
      }

      const response = await fetch("https://api-free.deepl.com/v2/translate", {
        method: "POST",
        headers: {
          "Authorization": `DeepL-Auth-Key ${DEEPL_API_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
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
      // Translate with auto-detection to get the detected language
      const params = new URLSearchParams();
      params.append("text", args.text);
      params.append("target_lang", "EN-US"); // Target doesn't matter for detection

      const response = await fetch("https://api-free.deepl.com/v2/translate", {
        method: "POST",
        headers: {
          "Authorization": `DeepL-Auth-Key ${DEEPL_API_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
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
