import { useEffect, useRef } from 'react';

/**
 * Analytics Event Types for tracking user behavior
 */
export interface AnalyticsEvent {
  event: string;
  category: 'search' | 'purchase_request' | 'supplier' | 'product' | 'conversion';
  action: string;
  label?: string;
  value?: number;
  data?: Record<string, any>;
}

/**
 * Send analytics event to backend or analytics service
 */
export function sendAnalyticsEvent(event: AnalyticsEvent) {
  // In production, this would send to your analytics backend
  // For now, log to console for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', event);
  }
  
  // Example: Send to analytics endpoint
  // fetch('/api/analytics', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(event),
  // });
}

/**
 * Hook to track search interactions
 */
export function useSearchAnalytics(category: 'product' | 'supplier') {
  const trackedQueries = useRef<Set<string>>(new Set());

  const trackSearch = (query: string, filters: any, resultsCount: number) => {
    if (trackedQueries.current.has(query)) return; // Avoid duplicate tracking
    
    trackedQueries.current.add(query);
    
    sendAnalyticsEvent({
      event: 'search_performed',
      category,
      action: 'search',
      label: query,
      value: resultsCount,
      data: { filters, resultsCount, timestamp: new Date().toISOString() },
    });
  };

  const trackResultClick = (resultId: string, resultName: string, position: number) => {
    sendAnalyticsEvent({
      event: 'search_result_clicked',
      category,
      action: 'click',
      label: resultName,
      value: position,
      data: { resultId, position, timestamp: new Date().toISOString() },
    });
  };

  const trackFilterChange = (filterType: string, filterValue: any) => {
    sendAnalyticsEvent({
      event: 'filter_changed',
      category,
      action: 'filter',
      label: `${filterType}: ${filterValue}`,
      data: { filterType, filterValue, timestamp: new Date().toISOString() },
    });
  };

  return { trackSearch, trackResultClick, trackFilterChange };
}

/**
 * Hook to track purchase request funnel
 */
export function usePurchaseRequestAnalytics() {
  const trackFormView = () => {
    sendAnalyticsEvent({
      event: 'purchase_request_form_viewed',
      category: 'conversion',
      action: 'view',
      data: { timestamp: new Date().toISOString() },
    });
  };

  const trackFormStart = () => {
    sendAnalyticsEvent({
      event: 'purchase_request_form_started',
      category: 'conversion',
      action: 'start',
      data: { timestamp: new Date().toISOString() },
    });
  };

  const trackFormSubmit = (formData: any) => {
    sendAnalyticsEvent({
      event: 'purchase_request_submitted',
      category: 'conversion',
      action: 'submit',
      value: 1,
      data: { 
        ...formData, 
        timestamp: new Date().toISOString(),
        // Don't send sensitive data
        contactEmail: formData.contactEmail?.substring(0, 3) + '***',
      },
    });
  };

  const trackSuccess = (requestId: string) => {
    sendAnalyticsEvent({
      event: 'purchase_request_success',
      category: 'conversion',
      action: 'success',
      value: 1,
      label: requestId,
      data: { requestId, timestamp: new Date().toISOString() },
    });
  };

  return { trackFormView, trackFormStart, trackFormSubmit, trackSuccess };
}

/**
 * Track page views
 */
export function usePageViewTracking() {
  useEffect(() => {
    const trackPageView = () => {
      sendAnalyticsEvent({
        event: 'page_view',
        category: 'conversion',
        action: 'view',
        label: window.location.pathname,
        data: { 
          path: window.location.pathname,
          title: document.title,
          timestamp: new Date().toISOString(),
        },
      });
    };

    trackPageView();
  }, []);
}

/**
 * Conversion tracking helper
 */
export function trackConversion(type: string, value?: number, data?: Record<string, any>) {
  sendAnalyticsEvent({
    event: 'conversion',
    category: 'conversion',
    action: type,
    value,
    data: {
      conversionType: type,
      timestamp: new Date().toISOString(),
      ...data,
    },
  });
}
