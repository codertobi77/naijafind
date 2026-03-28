import { useCallback } from 'react';
import { useAction } from 'convex/react';
import { api } from '@convex/_generated/api';

/**
 * Hook for using the product dictionary in search
 * Provides functions to expand queries and get related terms
 */
export function useDictionarySearch() {
  const expandQuery = useAction(api.productDictionary.expandSearchQuery);
  const getRelated = useAction(api.productDictionary.getRelatedTerms);
  const enhanceQuery = useAction(api.productDictionary.enhanceSearchQuery);
  const scoreText = useAction(api.productDictionary.scoreTextRelevance);

  /**
   * Expand a search query with dictionary synonyms
   */
  const expandSearchQuery = useCallback(async (query: string): Promise<string[]> => {
    if (!query || query.trim().length < 2) {
      return [query];
    }
    
    try {
      const result = await expandQuery({ query });
      return result.expanded;
    } catch (error) {
      console.error('Error expanding query:', error);
      return [query];
    }
  }, [expandQuery]);

  /**
   * Get related terms for a word
   */
  const getRelatedTerms = useCallback(async (term: string) => {
    if (!term || term.trim().length < 2) {
      return { found: false, synonyms: [], related: [] };
    }
    
    try {
      const result = await getRelated({ term });
      return {
        found: result.found,
        synonyms: result.synonyms || [],
        related: result.related || [],
        category: result.category,
      };
    } catch (error) {
      console.error('Error getting related terms:', error);
      return { found: false, synonyms: [], related: [] };
    }
  }, [getRelated]);

  /**
   * Enhance a search query with full dictionary information
   */
  const enhanceSearchQuery = useCallback(async (query: string, category?: string) => {
    if (!query || query.trim().length < 2) {
      return null;
    }
    
    try {
      const result = await enhanceQuery({ query, category });
      return {
        original: result.original,
        expanded: result.expanded,
        exactMatches: result.exactMatches,
        synonymMatches: result.synonymMatches,
        relatedMatches: result.relatedMatches,
        suggestedCategory: result.suggestedCategory,
      };
    } catch (error) {
      console.error('Error enhancing query:', error);
      return null;
    }
  }, [enhanceQuery]);

  /**
   * Score text relevance using dictionary
   */
  const scoreRelevance = useCallback(async (query: string, text: string) => {
    try {
      const result = await scoreText({ query, text });
      return {
        score: result.score,
        matchedTerms: result.matchedTerms,
        expandedTerms: result.expandedTerms,
      };
    } catch (error) {
      console.error('Error scoring relevance:', error);
      return { score: 0, matchedTerms: [], expandedTerms: [] };
    }
  }, [scoreText]);

  /**
   * Build an enhanced search query string from expanded terms
   */
  const buildEnhancedQuery = useCallback(async (query: string): Promise<string> => {
    const enhanced = await enhanceSearchQuery(query);
    if (!enhanced) return query;
    
    // Combine all unique terms
    const allTerms = new Set([
      ...enhanced.exactMatches,
      ...enhanced.synonymMatches.slice(0, 5), // Limit synonyms
      ...enhanced.relatedMatches.slice(0, 3), // Limit related
    ]);
    
    return Array.from(allTerms).join(' ');
  }, [enhanceSearchQuery]);

  return {
    expandSearchQuery,
    getRelatedTerms,
    enhanceSearchQuery,
    scoreRelevance,
    buildEnhancedQuery,
  };
}

export default useDictionarySearch;
