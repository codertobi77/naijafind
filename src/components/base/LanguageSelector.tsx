import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const LanguageSelector: React.FC = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const languages: Language[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];
  const currentIndex = languages.findIndex(lang => lang.code === currentLanguage.code);

  const handleLanguageChange = useCallback((languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
    setFocusedIndex(-1);
    buttonRef.current?.focus();
  }, [i18n]);

  const handleToggle = useCallback(() => {
    setIsOpen(prev => {
      if (!prev) {
        // When opening, focus the current language
        setFocusedIndex(currentIndex);
      }
      return !prev;
    });
  }, [currentIndex]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isOpen) {
      // When closed, open on Enter, Space, ArrowDown, or ArrowUp
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
        event.preventDefault();
        setIsOpen(true);
        setFocusedIndex(currentIndex);
      }
      return;
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        buttonRef.current?.focus();
        break;
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => (prev + 1) % languages.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => (prev - 1 + languages.length) % languages.length);
        break;
      case 'Home':
        event.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setFocusedIndex(languages.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < languages.length) {
          handleLanguageChange(languages[focusedIndex].code);
        }
        break;
      case 'Tab':
        // Close dropdown on Tab
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
      default:
        // Type-ahead: focus language starting with pressed key
        const char = event.key.toLowerCase();
        const matchIndex = languages.findIndex(
          lang => lang.name.toLowerCase().startsWith(char) || lang.nativeName.toLowerCase().startsWith(char)
        );
        if (matchIndex !== -1) {
          setFocusedIndex(matchIndex);
        }
        break;
    }
  }, [isOpen, focusedIndex, languages, currentIndex, handleLanguageChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Focus management for dropdown items
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]');
      const focusedItem = items[focusedIndex] as HTMLElement;
      focusedItem?.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen, focusedIndex]);

  const dropdownId = 'language-selector-listbox';

  return (
    <div 
      ref={containerRef} 
      className="relative"
      onKeyDown={handleKeyDown}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={dropdownId}
        aria-label={t('common.select_language', 'Select language')}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors cursor-pointer"
      >
        <span className="text-lg" aria-hidden="true">{currentLanguage.flag}</span>
        <span className="text-sm font-medium text-gray-700">{currentLanguage.nativeName}</span>
        <i 
          className={`ri-arrow-down-s-line text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        ></i>
      </button>

      {isOpen && (
        <ul
          ref={listRef}
          id={dropdownId}
          role="listbox"
          aria-label={t('common.available_languages', 'Available languages')}
          aria-activedescendant={focusedIndex >= 0 ? `language-option-${languages[focusedIndex].code}` : undefined}
          tabIndex={-1}
          className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[160px] py-1 focus:outline-none"
        >
          {languages.map((language, index) => {
            const isSelected = currentLanguage.code === language.code;
            const isFocused = focusedIndex === index;
            
            return (
              <li
                key={language.code}
                id={`language-option-${language.code}`}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleLanguageChange(language.code)}
                className={`
                  flex items-center space-x-2 px-3 py-2 cursor-pointer transition-colors
                  ${isFocused ? 'bg-blue-100' : 'hover:bg-gray-50'}
                  ${isSelected ? 'text-blue-600 font-medium' : 'text-gray-700'}
                `}
              >
                <span className="text-lg" aria-hidden="true">{language.flag}</span>
                <span className="text-sm flex-1">
                  <span>{language.nativeName}</span>
                  {language.nativeName !== language.name && (
                    <span className="text-gray-400 ml-1">({language.name})</span>
                  )}
                </span>
                {isSelected && (
                  <i className="ri-check-line text-blue-600" aria-hidden="true"></i>
                )}
              </li>
            );
          })}
        </ul>
      )}
      
      {/* Screen reader announcement for language change */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {t('common.current_language', 'Current language')}: {currentLanguage.nativeName}
      </div>
    </div>
  );
};

export default LanguageSelector;
