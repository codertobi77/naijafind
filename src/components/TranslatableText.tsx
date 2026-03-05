import React, { useEffect, useState } from "react";
import { useDeepLTranslation } from "../hooks/useDeepLTranslation";
import i18n from "../i18n";

interface TranslatableTextProps {
  text: string | null | undefined;
  className?: string;
  showToggle?: boolean;
  as?: "p" | "span" | "div" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

/**
 * Component that displays translatable text with optional original/translation toggle
 *
 * Usage:
 * ```tsx
 * <TranslatableText text={supplier.description} showToggle />
 * ```
 */
export const TranslatableText: React.FC<TranslatableTextProps> = ({
  text,
  className = "",
  showToggle = false,
  as: Component = "span",
}) => {
  const { translate, isTranslating } = useDeepLTranslation();
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(true);
  const currentLanguage = i18n.language;

  useEffect(() => {
    const loadTranslation = async () => {
      if (!text || currentLanguage === "en") {
        setTranslatedText(null);
        return;
      }

      const result = await translate(text, currentLanguage as "en" | "fr", "en");
      setTranslatedText(result);
    };

    loadTranslation();
  }, [text, currentLanguage, translate]);

  if (!text) {
    return <Component className={className}>—</Component>;
  }

  const displayText = showOriginal || !translatedText ? text : translatedText;
  const hasTranslation = translatedText && translatedText !== text;

  return (
    <Component className={`relative group ${className}`}>
      {isTranslating && (
        <span className="inline-flex items-center ml-2">
          <span className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full" />
        </span>
      )}

      {showToggle && hasTranslation ? (
        <span
          onClick={() => setShowOriginal(!showOriginal)}
          className="cursor-pointer hover:text-blue-600 transition-colors"
          title={showOriginal ? "Cliquez pour voir la traduction" : "Cliquez pour voir l'original"}
        >
          {displayText}
          <span className="ml-2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
            {showOriginal ? "(TR)" : "(EN)"}
          </span>
        </span>
      ) : (
        displayText
      )}
    </Component>
  );
};

interface TranslatableParagraphProps extends TranslatableTextProps {
  maxLength?: number;
  readMoreLabel?: string;
}

/**
 * Translatable paragraph with "read more" functionality
 * Useful for long descriptions like supplier descriptions
 */
export const TranslatableParagraph: React.FC<TranslatableParagraphProps> = ({
  text,
  className = "",
  maxLength = 200,
  readMoreLabel = "Read more",
}) => {
  const [expanded, setExpanded] = useState(false);
  const { translate, isTranslating } = useDeepLTranslation();
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const currentLanguage = i18n.language;

  useEffect(() => {
    const loadTranslation = async () => {
      if (!text || currentLanguage === "en") {
        setTranslatedText(null);
        return;
      }

      const result = await translate(text, currentLanguage as "en" | "fr", "en");
      setTranslatedText(result);
    };

    loadTranslation();
  }, [text, currentLanguage, translate]);

  if (!text) {
    return <p className={className}>—</p>;
  }

  const displayText = translatedText || text;
  const shouldTruncate = displayText.length > maxLength && !expanded;
  const truncatedText = shouldTruncate
    ? displayText.substring(0, maxLength) + "..."
    : displayText;

  return (
    <div className={className}>
      <p className="relative">
        {truncatedText}
        {isTranslating && (
          <span className="absolute -right-6 top-0">
            <span className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full inline-block" />
          </span>
        )}
      </p>

      {displayText.length > maxLength && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-blue-600 hover:text-blue-800 text-sm mt-1 font-medium"
        >
          {expanded ? "Show less" : readMoreLabel}
        </button>
      )}

      {translatedText && (
        <p className="text-xs text-gray-400 mt-1 italic">
          Translated from English
        </p>
      )}
    </div>
  );
};

interface BatchTranslatableListProps<T> {
  items: T[];
  getText: (item: T) => string;
  renderItem: (item: T, translatedText: string | null, isLoading: boolean) => React.ReactNode;
  className?: string;
}

/**
 * Component for efficiently translating a list of items
 * Uses batch translation for better performance
 */
export function BatchTranslatableList<T>({
  items,
  getText,
  renderItem,
  className = "",
}: BatchTranslatableListProps<T>) {
  const { translateBatch, isTranslating } = useDeepLTranslation();
  const [translations, setTranslations] = useState<Map<number, string>>(new Map());
  const currentLanguage = i18n.language;

  useEffect(() => {
    const loadTranslations = async () => {
      if (!items.length || currentLanguage === "en") {
        setTranslations(new Map());
        return;
      }

      const texts = items.map(getText);
      const results = await translateBatch(
        texts,
        currentLanguage as "en" | "fr",
        "en"
      );

      const newTranslations = new Map<number, string>();
      results.forEach((result, index) => {
        if (result.translated) {
          newTranslations.set(index, result.translated);
        }
      });

      setTranslations(newTranslations);
    };

    loadTranslations();
  }, [items, currentLanguage, translateBatch, getText]);

  return (
    <div className={className}>
      {items.map((item, index) => (
        <div key={index}>
          {renderItem(
            item,
            translations.get(index) || null,
            isTranslating
          )}
        </div>
      ))}
    </div>
  );
}
