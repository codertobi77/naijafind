import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation, type TFunction } from 'react-i18next';
import { Header } from '../../components/base';
import { useConvexAuth, useMutation, useAction } from 'convex/react';
import { useConvexQuery } from '../../hooks/useConvexQuery';
import { api } from '@convex/_generated/api';
import type { Doc } from 'convex/values';
import Modal from '../../components/base/Modal';
import { HeroSection, Section, Container, Footer } from '../../components/layout';
import { CTASection } from '../../components/ui';
import { FormSelect } from '../../components/forms';
import i18n from '../../i18n';

// Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Custom hook for recent searches
function useRecentSearches(key: string, maxItems: number = 5) {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch {
        setRecentSearches([]);
      }
    }
  }, [key]);

  const addRecentSearch = useCallback((search: string) => {
    if (!search.trim()) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== search.toLowerCase());
      const updated = [search, ...filtered].slice(0, maxItems);
      localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    });
  }, [key, maxItems]);

  const clearRecentSearches = useCallback(() => {
    localStorage.removeItem(key);
    setRecentSearches([]);
  }, [key]);

  return { recentSearches, addRecentSearch, clearRecentSearches };
}

// Auto-scrollable Ad Banner Carousel Component
interface AdBanner {
  id: string;
  image: string;
  alt: string;
  link?: string;
}

function AdBannerCarousel({ banners }: { banners: AdBanner[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const bannerCount = banners.length;

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || bannerCount <= 1) return;

    let animationId: number;
    let scrollPosition = 0;

    const animate = () => {
      if (!isPaused) {
        scrollPosition += 0.5; // Scroll speed
        const maxScroll = scrollContainer.scrollWidth / 2;
        
        if (scrollPosition >= maxScroll) {
          scrollPosition = 0;
        }
        
        scrollContainer.scrollLeft = scrollPosition;
      }
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [isPaused, bannerCount]);

  // Square format for 1080×1080 ads
  const bannerSize = bannerCount === 1 ? 'w-full max-w-[400px] aspect-square' : 
    bannerCount === 2 ? 'w-[48%] max-w-[400px] aspect-square' : 
    'w-[300px] sm:w-[350px] md:w-[400px] aspect-square';

  // Only duplicate for seamless loop if we have more than 2 banners
  const displayBanners = bannerCount > 2 ? [...banners, ...banners] : banners;

  return (
    <div 
      className="w-full bg-gray-100 py-4 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        ref={scrollRef}
        className="flex gap-4 px-4 overflow-x-hidden scroll-smooth"
        style={{ scrollBehavior: 'auto' }}
      >
        {displayBanners.map((banner, index) => (
          <a
            key={`${banner.id}-${index}`}
            href={banner.link || '#'}
            className={`flex-shrink-0 ${bannerSize} rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 group`}
          >
            <img
              src={banner.image}
              alt={banner.alt}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            />
          </a>
        ))}
      </div>
    </div>
  );
}

type Supplier = Doc<"suppliers">;

// Search Hero Component with Autocomplete
interface SearchHeroProps {
  t: TFunction;
  searchQuery: string;
  searchLocation: string;
  category: string;
  categories: Array<{ _id: string; name: string }> | undefined;
  setSearchQuery: (value: string) => void;
  setSearchLocation: (value: string) => void;
  setCategory: (value: string) => void;
  onSearch: () => void;
  recentSearches: string[];
  recentLocations: string[];
  onAddRecentSearch: (search: string) => void;
  onAddRecentLocation: (location: string) => void;
  onClearRecentSearches: () => void;
  onClearRecentLocations: () => void;
}


interface SuggestionItem {
  text: string;
  type: 'product' | 'supplier' | 'category' | 'location';
  icon: string;
  subtext?: string;
}

interface SearchSuggestionsResult {
  suggestions: string[];
  locations: string[];
}

function SearchInputWithSuggestions({
  value,
  onChange,
  placeholder,
  label,
  icon,
  type,
  recentSearches,
  onAddRecentSearch,
  onClearRecentSearches,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  icon: string;
  type: 'search' | 'location';
  recentSearches: string[];
  onAddRecentSearch?: (search: string) => void;
  onClearRecentSearches?: () => void;
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<SuggestionItem[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce the input value
  const debouncedValue = useDebounce(value, 300);
  
  // Get current language for bilingual search
  const currentLanguage = i18n.language as 'en' | 'fr';

  // Use Convex action for bilingual search suggestions
  const searchSuggestionsAction = useAction(api.searchSuggestions.searchSuggestionsWithQuery);
  
  // Fetch suggestions when debounced value changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedValue.trim()) {
        setHasSearched(false);
        setIsLoading(false);
        if (recentSearches.length > 0) {
          const recentItems: SuggestionItem[] = recentSearches.map((s) => ({
            text: s,
            type: type === 'location' ? 'location' : 'product',
            icon: type === 'location' ? 'ri-map-pin-line' : 'ri-time-line',
            subtext: 'Récent',
          }));
          setFilteredSuggestions(recentItems);
        } else {
          setFilteredSuggestions([]);
        }
        return;
      }

      setIsLoading(true);
      setHasSearched(true);

      try {
        const results = await searchSuggestionsAction({
          query: debouncedValue,
          limit: 10,
          userLanguage: currentLanguage,
        });

        // Categorize and build suggestions
        const items: SuggestionItem[] = [];
        
        if (type === 'location') {
          // For location input, use location results
          results.locations.forEach((loc) => {
            items.push({
              text: loc,
              type: 'location',
              icon: 'ri-map-pin-line',
            });
          });
        } else {
          // For search input, categorize results
          results.suggestions.forEach((s) => {
            let itemType: 'product' | 'supplier' | 'category' = 'product';
            let itemIcon = 'ri-search-line';
            let subtext: string | undefined;

            // Heuristics to determine type
            const lower = s.toLowerCase();
            if (lower.includes('ltd') || lower.includes('limited') || lower.includes('inc') || lower.includes('corp') || lower.includes('nigeria') || lower.includes('services') || lower.includes('enterprise')) {
              itemType = 'supplier';
              itemIcon = 'ri-building-4-line';
              subtext = 'Fournisseur';
            } else if (s.split(' ').length === 1 && s.length < 20) {
              itemType = 'category';
              itemIcon = 'ri-folder-3-line';
              subtext = 'Catégorie';
            }

            items.push({
              text: s,
              type: itemType,
              icon: itemIcon,
              subtext,
            });
          });
        }

        setFilteredSuggestions(items);
      } catch (error) {
        console.error('Search suggestions error:', error);
        setFilteredSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedValue, type, recentSearches, searchSuggestionsAction, currentLanguage]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleFocus = () => {
    setShowSuggestions(true);
    // Show recent searches if value is empty
    if (!value.trim() && recentSearches.length > 0) {
      const recentItems: SuggestionItem[] = recentSearches.map((s) => ({
        text: s,
        type: type === 'location' ? 'location' : 'product',
        icon: 'ri-time-line',
        subtext: 'Récent',
      }));
      setFilteredSuggestions(recentItems);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion: SuggestionItem) => {
    onChange(suggestion.text);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    onAddRecentSearch?.(suggestion.text);
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
    setFilteredSuggestions([]);
    setHasSearched(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) {
      if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredSuggestions.length) {
          handleSuggestionClick(filteredSuggestions[highlightedIndex]);
        } else if (value.trim()) {
          // Search with current value
          setShowSuggestions(false);
          onAddRecentSearch?.(value);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return <span className="text-gray-700">{text}</span>;

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) return <span className="text-gray-700">{text}</span>;

    const before = text.slice(0, index);
    const match = text.slice(index, index + query.length);
    const after = text.slice(index + query.length);

    return (
      <span className="text-gray-700">
        {before}
        <span className="font-semibold text-green-700">{match}</span>
        {after}
      </span>
    );
  };

  // Group suggestions by type for display
  const groupedSuggestions = filteredSuggestions.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, SuggestionItem[]>);

  const typeLabels: Record<string, string> = {
    supplier: 'Fournisseurs',
    product: 'Produits',
    category: 'Catégories',
    location: 'Lieux',
  };

  const typeOrder = type === 'location'
    ? ['location']
    : ['supplier', 'product', 'category'];

  const showRecentSection = !value.trim() && recentSearches.length > 0 && !hasSearched;
  const showEmptyState = hasSearched && !isLoading && filteredSuggestions.length === 0 && value.trim().length > 0;

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-semibold text-gray-700 mb-2 min-h-[2.5rem] flex items-center">
        <i className={`${icon} mr-1`}></i>{label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-activedescendant={highlightedIndex >= 0 ? `suggestion-${highlightedIndex}` : undefined}
        />
        {/* Clear button */}
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Clear input"
          >
            <i className="ri-close-line text-gray-400 text-sm"></i>
          </button>
        )}
      </div>

      {showSuggestions && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Loading state */}
          {isLoading && (
            <div className="px-4 py-6 flex items-center justify-center gap-2 text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
              <span className="text-sm">Recherche en cours...</span>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && showEmptyState && (
            <div className="px-4 py-6 text-center">
              <i className="ri-search-line text-3xl text-gray-300 mb-2"></i>
              <p className="text-sm text-gray-500">Aucun résultat pour &quot;{value}&quot;</p>
              <p className="text-xs text-gray-400 mt-1">Essayez avec d&apos;autres termes</p>
            </div>
          )}

          {/* Recent searches section */}
          {!isLoading && showRecentSection && (
            <>
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Recherches récentes
                </span>
                <button
                  onClick={onClearRecentSearches}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Effacer
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {filteredSuggestions.map((suggestion, idx) => {
                  const isHighlighted = idx === highlightedIndex;
                  return (
                    <button
                      key={`recent-${idx}`}
                      id={`suggestion-${idx}`}
                      onClick={() => handleSuggestionClick(suggestion)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-all duration-150 ${
                        isHighlighted ? 'bg-green-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isHighlighted ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <i className={`${suggestion.icon} ${isHighlighted ? 'text-green-600' : 'text-gray-500'}`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-700">{suggestion.text}</div>
                        {suggestion.subtext && (
                          <div className="text-xs text-gray-400">{suggestion.subtext}</div>
                        )}
                      </div>
                      {isHighlighted && (
                        <i className="ri-corner-down-left-line text-green-600 text-sm"></i>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Search results */}
          {!isLoading && !showEmptyState && !showRecentSection && filteredSuggestions.length > 0 && (
            <>
              {/* Header with result count */}
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {filteredSuggestions.length} résultat{filteredSuggestions.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {typeOrder.map((typeKey) => {
                  const items = groupedSuggestions[typeKey];
                  if (!items || items.length === 0) return null;

                  return (
                    <div key={typeKey} className="border-b border-gray-50 last:border-0">
                      {/* Category header */}
                      <div className="px-4 py-1.5 bg-gray-50/50">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          {typeLabels[typeKey]}
                        </span>
                      </div>

                      {/* Suggestions in this category */}
                      {items.map((suggestion, idx) => {
                        const globalIndex = filteredSuggestions.findIndex((s) => s === suggestion);
                        const isHighlighted = globalIndex === highlightedIndex;

                        return (
                          <button
                            key={`${typeKey}-${idx}`}
                            id={`suggestion-${globalIndex}`}
                            onClick={() => handleSuggestionClick(suggestion)}
                            onMouseEnter={() => setHighlightedIndex(globalIndex)}
                            className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-all duration-150 ${
                              isHighlighted ? 'bg-green-50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isHighlighted ? 'bg-green-100' : 'bg-gray-100'
                            }`}>
                              <i className={`${suggestion.icon} ${isHighlighted ? 'text-green-600' : 'text-gray-500'}`}></i>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm truncate">
                                {highlightMatch(suggestion.text, value)}
                              </div>
                              {suggestion.subtext && (
                                <div className="text-xs text-gray-400">{suggestion.subtext}</div>
                              )}
                            </div>
                            {isHighlighted && (
                              <i className="ri-corner-down-left-line text-green-600 text-sm"></i>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Footer with keyboard hints */}
          {(filteredSuggestions.length > 0 || showRecentSection) && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 font-sans">↓</kbd>
                  <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 font-sans">↑</kbd>
                  <span>naviguer</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 font-sans">↵</kbd>
                  <span>sélectionner</span>
                </span>
              </div>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 font-sans">esc</kbd>
                <span>fermer</span>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SearchHero({ t, searchQuery, searchLocation, category, categories, setSearchQuery, setSearchLocation, setCategory, onSearch, recentSearches, recentLocations, onAddRecentSearch, onAddRecentLocation, onClearRecentSearches, onClearRecentLocations }: SearchHeroProps) {
  return (
    <HeroSection
      backgroundImage="https://readdy.ai/api/search-image?query=Modern%20Nigerian%20marketplace%20with%20vendors%20selling%20colorful%20products%2C%20bustling%20commercial%20district%20in%20Lagos%20with%20traditional%20and%20modern%20buildings%2C%20vibrant%20street%20scene%20with%20people%20shopping%2C%20warm%20golden%20lighting%2C%20professional%20photography%20style%2C%20clean%20organized%20market%20stalls&width=1200&height=600&seq=hero-nigeria&orientation=landscape"
      backgroundGradient="from-black/60 via-black/50 to-black/40"
      showBadge={true}
      badgeText={t('hero.badge_trusted')}
      badgeIcon=""
      title={t('hero.title')}
      subtitle={t('hero.subtitle')}
    >
      {/* Search Form */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="sm:col-span-2 lg:col-span-1">
            <SearchInputWithSuggestions
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={t('hero.search_placeholder')}
              label={t('hero.search_placeholder')}
              icon="ri-search-line"
              type="search"
              recentSearches={recentSearches}
              onAddRecentSearch={onAddRecentSearch}
              onClearRecentSearches={onClearRecentSearches}
            />
          </div>
          <div>
            <SearchInputWithSuggestions
              value={searchLocation}
              onChange={setSearchLocation}
              placeholder={t('hero.location_placeholder')}
              label={t('label.location')}
              icon="ri-map-pin-line"
              type="location"
              recentSearches={recentLocations}
              onAddRecentSearch={onAddRecentLocation}
              onClearRecentSearches={onClearRecentLocations}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 min-h-[2.5rem] flex items-center">
              <i className="ri-list-check mr-1"></i>{t('label.category')}
            </label>
            <FormSelect
              value={category}
              onChange={(value) => setCategory(value)}
              options={[
                { value: '', label: t('categories.view_all') },
                ...(categories?.map((cat) => ({ value: cat.name, label: cat.name })) || [])
              ]}
            />
          </div>
        </div>
        <button
          onClick={onSearch}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-8 rounded-xl hover:shadow-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-semibold text-base transform hover:-translate-y-0.5"
        >
          <i className="ri-search-line mr-2 text-lg"></i>
          {t('hero.cta')}
        </button>
      </div>
    </HeroSection>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useConvexAuth();

  // Using React Query cached queries instead of direct Convex queries
  const { data: meData } = useConvexQuery(api.users.me, {}, { staleTime: 2 * 60 * 1000 });
  const { data: featuredSuppliersData, isLoading: featuredSuppliersLoading } = useConvexQuery(
    api.admin.getFeaturedSuppliersPublic,
    {},
    { staleTime: 10 * 60 * 1000 }
  );
  
  // Timeout for featured suppliers loading to prevent infinite spinner
  const [featuredSuppliersTimeout, setFeaturedSuppliersTimeout] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (featuredSuppliersLoading) {
        setFeaturedSuppliersTimeout(true);
      }
    }, 8000); // 8 seconds timeout for featured suppliers
    
    return () => clearTimeout(timer);
  }, [featuredSuppliersLoading]);
  const { data: categories } = useConvexQuery(
    api.categories.getAllCategories,
    {},
    { staleTime: 15 * 60 * 1000 }
  );
  
  // Use action for search suggestions (optimized version)
  const getSearchSuggestionsAction = useAction(api.searchSuggestions.getSearchSuggestions);
  const [searchSuggestionsData, setSearchSuggestionsData] = useState<any>(null);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(true);
  
  // Fetch search suggestions on mount
  useEffect(() => {
    const fetchSuggestions = async () => {
      setIsSuggestionsLoading(true);
      try {
        const result = await getSearchSuggestionsAction({ limit: 100 });
        setSearchSuggestionsData(result);
      } catch (error) {
        console.error('Failed to fetch search suggestions:', error);
      } finally {
        setIsSuggestionsLoading(false);
      }
    };
    
    void fetchSuggestions();
  }, [getSearchSuggestionsAction]);

  // Fetch active homepage banners from database
  const { data: homepageBanners } = useConvexQuery(
    api.adBanners.getActiveBannersByPosition,
    { position: 'homepage_top' },
    { staleTime: 5 * 60 * 1000 }
  );

  // Newsletter subscription mutation
  const subscribeToNewsletter = useMutation(api.emails.subscribeToNewsletter);
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Contact modal state
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactView, setContactView] = useState<'options' | 'message'>('options');
  const [contactMessage, setContactMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Modal state for newsletter
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    icon: 'success' as 'success' | 'info' | 'warning'
  });

  // Handle location state message
  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [category, setCategory] = useState('');

  // Recent searches hooks
  const { recentSearches, addRecentSearch: onAddRecentSearch, clearRecentSearches: onClearRecentSearches } = useRecentSearches('Suji_recent_searches', 5);
  const { recentSearches: recentLocations, addRecentSearch: onAddRecentLocation, clearRecentSearches: onClearRecentLocations } = useRecentSearches('Suji_recent_locations', 5);

  // Extract suppliers array from Convex response
  const featuredSuppliers: Supplier[] = featuredSuppliersData || [];

  // Search suggestions from database (products, suppliers, categories, locations)
  const searchTerms = searchSuggestionsData?.searchTerms || [];
  const locationSuggestions = searchSuggestionsData?.locations || [];

  const handleAddBusinessClick = () => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate('/auth/register?type=supplier');
      } else {
        if (meData?.user?.user_type === 'supplier') {
          navigate('/dashboard');
        } else {
          navigate('/dashboard?action=become-supplier');
        }
      }
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) {
      params.set('q', searchQuery);
      onAddRecentSearch(searchQuery);
    }
    if (searchLocation) {
      params.set('location', searchLocation);
      onAddRecentLocation(searchLocation);
    }
    if (category) params.set('category', category);
    navigate(`/search?${params.toString()}`);
  };

  const stats = [
    { icon: 'ri-building-line', iconColor: 'text-green-600', iconBg: 'from-green-100 to-emerald-100', value: '25,000+', label: t('stats.suppliers') },
    { icon: 'ri-folder-line', iconColor: 'text-green-600', iconBg: 'from-green-100 to-emerald-100', value: '500+', label: t('stats.product_categories') },
    { icon: 'ri-map-pin-line', iconColor: 'text-green-600', iconBg: 'from-green-100 to-emerald-100', value: '36', label: t('stats.states') },
    { icon: 'ri-search-line', iconColor: 'text-green-600', iconBg: 'from-green-100 to-emerald-100', value: '1M+', label: t('stats.monthly_searches') },
  ];

  const newsletterBenefits = [
    t('newsletter.benefit1'),
    t('newsletter.benefit2'),
    t('newsletter.benefit3'),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <Header />

      {/* Show message if redirected from dashboard */}
      {message && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
          <p>{message}</p>
        </div>
      )}

      {/* Hero Section */}
      <SearchHero
        t={t}
        searchQuery={searchQuery}
        searchLocation={searchLocation}
        category={category}
        categories={categories}
        setSearchQuery={setSearchQuery}
        setSearchLocation={setSearchLocation}
        setCategory={setCategory}
        onSearch={handleSearch}
        recentSearches={recentSearches}
        recentLocations={recentLocations}
        onAddRecentSearch={onAddRecentSearch}
        onAddRecentLocation={onAddRecentLocation}
        onClearRecentSearches={onClearRecentSearches}
        onClearRecentLocations={onClearRecentLocations}
      />

      {/* Stats Section */}
      <Section background="white" padding="md">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-green-600 mb-1">{stat.value}</div>
                <div className="text-gray-600 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Ad Banner Carousel - Only show if there are active banners */}
      {homepageBanners && homepageBanners.length > 0 && (
        <AdBannerCarousel 
          banners={homepageBanners.map(banner => ({
            id: banner._id,
            image: banner.image,
            alt: banner.name,
            link: banner.link
          }))}
        />
      )}

      {/* Premium Suppliers Section */}
      <Section background="white" padding="md">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{t('featured.title')}</h2>
            <p className="text-gray-600">{t('featured.subtitle')}</p>
          </div>

          {(featuredSuppliersLoading && !featuredSuppliersTimeout) ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : (featuredSuppliersLoading && featuredSuppliersTimeout) ? (
            <div className="text-center py-12">
              <i className="ri-time-line text-4xl text-yellow-500 mb-4"></i>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('stats.loading')}
              </h3>
              <p className="text-gray-600 mb-4">
                {t('stats.loading_slow')}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <i className="ri-refresh-line mr-2"></i>
                {t('stats.retry')}
              </button>
            </div>
          ) : featuredSuppliers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredSuppliers.slice(0, 6).map((supplier: any) => (
                <div 
                  key={supplier._id} 
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-100"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={supplier.image || `https://readdy.ai/api/search-image?query=${encodeURIComponent(supplier.business_name + ' ' + supplier.category + ' business Nigeria')}&width=400&height=300&seq=premium-${supplier._id}&orientation=landscape`}
                      alt={supplier.business_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://readdy.ai/api/search-image?query=${encodeURIComponent(supplier.business_name + ' ' + supplier.category + ' business Nigeria')}&width=400&height=300&seq=premium-${supplier._id}&orientation=landscape`;
                        target.onerror = null;
                      }}
                    />
                    <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                      <i className="ri-shield-check-line mr-1"></i>
                      {t('featured.verified')}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{supplier.business_name}</h3>
                      <div className="flex items-center bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-medium">
                        <i className="ri-star-fill mr-1 text-yellow-500"></i>
                        {supplier.rating?.toFixed(1) || '0.0'}
                      </div>
                    </div>
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">{supplier.description || t('msg.no_description')}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-600 font-medium bg-green-50 px-2 py-1 rounded">{supplier.category}</span>
                      <span className="text-gray-500 flex items-center">
                        <i className="ri-map-pin-line mr-1"></i>
                        {supplier.city}, {supplier.state}
                      </span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                      <a 
                        href={supplier.phone ? `tel:${supplier.phone}` : '#'}
                        className="flex items-center hover:text-green-600 transition-colors"
                        onClick={(e) => !supplier.phone && e.preventDefault()}
                      >
                        <i className="ri-phone-line mr-1"></i>
                        {supplier.phone || t('featured.contact')}
                      </a>
                      <Link
                        to={`/supplier/${supplier._id}`}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        {t('featured.view_details')}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <i className="ri-store-2-line text-5xl text-gray-300 mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('premium.no_suppliers')}</h3>
              <p className="text-gray-600">{t('premium.no_suppliers_desc')}</p>
            </div>
          )}
        </Container>
      </Section>

      {/* Newsletter Section */}
      <Section background="green-dark" padding="lg">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">{t('newsletter.stay_informed')}</h2>
              <p className="text-white/90 mb-6 leading-relaxed">{t('newsletter.description')}</p>
              <ul className="space-y-3 text-white/90">
                <li className="flex items-center">
                  <i className="ri-check-line text-lg mr-3"></i>
                  {t('newsletter.benefit1')}
                </li>
                <li className="flex items-center">
                  <i className="ri-check-line text-lg mr-3"></i>
                  {t('newsletter.benefit2')}
                </li>
                <li className="flex items-center">
                  <i className="ri-check-line text-lg mr-3"></i>
                  {t('newsletter.benefit3')}
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('newsletter.form_title')}</h3>
              <form className="space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const name = formData.get('name') as string;
                const email = formData.get('email') as string;
                const sector = formData.get('sector') as string;

                try {
                  setIsSubscribing(true);
                  const result = await subscribeToNewsletter({
                    email,
                    name: name || undefined,
                    sector: sector || undefined,
                  });

                  if (result.success) {
                    setModalConfig({
                      title: t('newsletter.success_title'),
                      message: result.alreadySubscribed
                        ? t('newsletter.already_subscribed')
                        : t('newsletter.success_message'),
                      icon: 'success'
                    });
                    setModalOpen(true);
                    (e.target as HTMLFormElement).reset();
                  } else {
                    setModalConfig({
                      title: t('newsletter.error_title'),
                      message: result.message || t('newsletter.error_message'),
                      icon: 'warning'
                    });
                    setModalOpen(true);
                  }
                } catch (error: any) {
                  const errorMessage = error?.message || t('newsletter.error_message');
                  setModalConfig({
                    title: t('newsletter.error_title'),
                    message: errorMessage,
                    icon: 'warning'
                  });
                  setModalOpen(true);
                } finally {
                  setIsSubscribing(false);
                }
              }}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('newsletter.full_name')}</label>
                  <input
                    type="text"
                    name="name"
                    placeholder={t('newsletter.name_placeholder')}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('label.email')}</label>
                  <input
                    type="email"
                    name="email"
                    placeholder={t('newsletter.email_placeholder')}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('newsletter.sector')}</label>
                  <select
                    name="sector"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm bg-white"
                  >
                    <option value="">{t('newsletter.select_sector')}</option>
                    {categories?.map((cat) => (
                      <option key={cat._id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={isSubscribing}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <i className="ri-mail-line mr-2"></i>
                  {isSubscribing ? t('newsletter.submitting') : t('newsletter.subscribe_button')}
                </button>
              </form>
            </div>
          </div>
        </Container>
      </Section>

      {/* CTA Section */}
      <CTASection
        variant="dark"
        title={t('contact.title')}
        subtitle={t('contact.subtitle')}
        primaryAction={{
          onClick: handleAddBusinessClick,
          label: t('contact.register_free'),
        }}
        secondaryAction={{
          onClick: () => setContactModalOpen(true),
          label: t('contact.talk_advisor'),
          icon: 'ri-chat-3-line',
        }}
      />

      {/* Footer */}
      <Footer variant="dark" showLogo={false} />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalConfig.title}
        message={modalConfig.message}
        buttonText="OK"
        icon={modalConfig.icon}
      />

      {/* Contact Modal - Olufona */}
      {contactModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => {
            setContactModalOpen(false);
            setContactView('options');
            setMessageSent(false);
            setContactMessage('');
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">{t('contact.modal.title')}</h3>
                  <p className="text-green-100 text-sm mt-1">{t('contact.modal.subtitle')}</p>
                </div>
                <button 
                  onClick={() => {
                    setContactModalOpen(false);
                    setContactView('options');
                    setMessageSent(false);
                    setContactMessage('');
                  }}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <i className="ri-close-line text-lg"></i>
                </button>
              </div>
            </div>

            {/* Options View */}
            {contactView === 'options' && (
              <div className="p-6 space-y-4">
                {/* Email */}
                <a
                  href="mailto:contact@olufona.com"
                  className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-green-500 hover:bg-green-50 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <i className="ri-mail-line text-2xl"></i>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{t('contact.modal.email')}</h4>
                    <p className="text-sm text-gray-500">contact@olufona.com</p>
                  </div>
                  <i className="ri-arrow-right-line text-gray-400 group-hover:text-green-600"></i>
                </a>

                {/* WhatsApp */}
                <a
                  href="https://wa.me/234XXXXXXXXXX"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-green-500 hover:bg-green-50 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <i className="ri-whatsapp-line text-2xl"></i>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">WhatsApp</h4>
                    <p className="text-sm text-gray-500">+234 XXX XXX XXXX</p>
                  </div>
                  <i className="ri-arrow-right-line text-gray-400 group-hover:text-green-600"></i>
                </a>

                {/* Internal Message Option */}
                <button
                  onClick={() => setContactView('message')}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-green-500 hover:bg-green-50 transition-all group text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <i className="ri-message-3-line text-2xl"></i>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{t('contact.modal.message')}</h4>
                    <p className="text-sm text-gray-500">{t('contact.modal.internal_message')}</p>
                  </div>
                  <i className="ri-arrow-right-line text-gray-400 group-hover:text-green-600"></i>
                </button>
              </div>
            )}

            {/* Message Form View */}
            {contactView === 'message' && (
              <div className="p-6">
                <button
                  onClick={() => {
                    setContactView('options');
                    setMessageSent(false);
                    setContactMessage('');
                  }}
                  className="flex items-center text-gray-500 hover:text-gray-700 mb-4 transition-colors"
                >
                  <i className="ri-arrow-left-line mr-2"></i>
                  {t('contact.modal.back')}
                </button>
                
                <h4 className="font-semibold text-gray-900 mb-4">{t('contact.modal.send_message')}</h4>
                
                {messageSent ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
                      <i className="ri-check-line text-3xl"></i>
                    </div>
                    <h5 className="font-semibold text-gray-900 mb-2">{t('contact.modal.sent_title')}</h5>
                    <p className="text-gray-500 text-sm">{t('contact.modal.sent_message')}</p>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setIsSendingMessage(true);
                      // Simulate sending message - in production, call an API
                      setTimeout(() => {
                        setIsSendingMessage(false);
                        setMessageSent(true);
                        setContactMessage('');
                      }, 1000);
                    }}
                  >
                    <textarea
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder={t('contact.modal.placeholder')}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none h-32 mb-4"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isSendingMessage || !contactMessage.trim()}
                      className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSendingMessage ? (
                        <>
                          <i className="ri-loader-4-line animate-spin"></i>
                          {t('contact.modal.sending')}
                        </>
                      ) : (
                        <>
                          <i className="ri-send-plane-line"></i>
                          {t('contact.modal.send_button')}
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Footer - Only show on options view */}
            {contactView === 'options' && (
              <div className="px-6 py-4 bg-gray-50 text-center">
                <p className="text-xs text-gray-500">
                  {t('contact.modal.availability')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
