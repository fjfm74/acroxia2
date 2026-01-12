// Google Analytics 4 + Tag Manager Tracking Utility

// Conversion event types
export type ConversionType =
  | 'sign_up'
  | 'login'
  | 'analysis_started'
  | 'analysis_completed'
  | 'free_analysis_started'
  | 'free_analysis_completed'
  | 'purchase_intent'
  | 'lead_captured'
  | 'contact_submitted'
  | 'contract_generated';

interface EventParams {
  [key: string]: string | number | boolean | undefined | null;
}

// Global declarations for TypeScript
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

// Check if gtag is available
const isGtagAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
};

// Check if dataLayer is available
const isDataLayerAvailable = (): boolean => {
  return typeof window !== 'undefined' && Array.isArray(window.dataLayer);
};

/**
 * Track a generic event
 */
export const trackEvent = (eventName: string, params?: EventParams): void => {
  if (!isGtagAvailable()) {
    console.debug('[Analytics] gtag not available, skipping event:', eventName);
    return;
  }

  const eventParams = {
    ...params,
    timestamp: new Date().toISOString(),
  };

  window.gtag('event', eventName, eventParams);

  // Also push to dataLayer for GTM
  if (isDataLayerAvailable()) {
    window.dataLayer.push({
      event: eventName,
      ...eventParams,
    });
  }

  console.debug('[Analytics] Event tracked:', eventName, eventParams);
};

/**
 * Track a conversion event (high-value actions)
 */
export const trackConversion = (
  conversionType: ConversionType,
  params?: EventParams
): void => {
  if (!isGtagAvailable()) {
    console.debug('[Analytics] gtag not available, skipping conversion:', conversionType);
    return;
  }

  const conversionParams = {
    event_category: 'conversion',
    event_label: conversionType,
    ...params,
    timestamp: new Date().toISOString(),
  };

  window.gtag('event', conversionType, conversionParams);

  // Push to dataLayer for GTM custom triggers
  if (isDataLayerAvailable()) {
    window.dataLayer.push({
      event: conversionType,
      conversionType,
      ...params,
    });
  }

  console.debug('[Analytics] Conversion tracked:', conversionType, conversionParams);
};

/**
 * Track page view (for SPA navigation)
 */
export const trackPageView = (pagePath: string, pageTitle?: string): void => {
  if (!isGtagAvailable()) {
    console.debug('[Analytics] gtag not available, skipping page view:', pagePath);
    return;
  }

  window.gtag('event', 'page_view', {
    page_path: pagePath,
    page_title: pageTitle || document.title,
    page_location: window.location.href,
  });

  // Push to dataLayer for GTM
  if (isDataLayerAvailable()) {
    window.dataLayer.push({
      event: 'page_view',
      page_path: pagePath,
      page_title: pageTitle || document.title,
    });
  }

  console.debug('[Analytics] Page view tracked:', pagePath);
};

/**
 * Identify user after login/signup (for GA4 User-ID)
 */
export const identifyUser = (userId: string, userProperties?: EventParams): void => {
  if (!isGtagAvailable()) {
    console.debug('[Analytics] gtag not available, skipping user identification');
    return;
  }

  window.gtag('set', 'user_properties', {
    user_id: userId,
    ...userProperties,
  });

  // Also set user_id config
  window.gtag('config', 'G-BCJK9MP2NV', {
    user_id: userId,
  });

  // Push to dataLayer for GTM
  if (isDataLayerAvailable()) {
    window.dataLayer.push({
      event: 'user_identified',
      user_id: userId,
      ...userProperties,
    });
  }

  console.debug('[Analytics] User identified:', userId);
};

/**
 * Track e-commerce events (for future Stripe integration)
 */
export const trackPurchase = (
  transactionId: string,
  value: number,
  currency: string = 'EUR',
  items?: Array<{ item_id: string; item_name: string; price: number }>
): void => {
  if (!isGtagAvailable()) return;

  window.gtag('event', 'purchase', {
    transaction_id: transactionId,
    value,
    currency,
    items,
  });

  if (isDataLayerAvailable()) {
    window.dataLayer.push({
      event: 'purchase',
      ecommerce: {
        transaction_id: transactionId,
        value,
        currency,
        items,
      },
    });
  }

  console.debug('[Analytics] Purchase tracked:', transactionId, value);
};
