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
  | 'contract_generated'
  | 'onboarding_completed'
  | 'cta_clicked'
  | 'download_completed'
  | 'scroll_milestone';

interface EventParams {
  [key: string]: string | number | boolean | undefined | null;
}

interface GTMEvent {
  event: string;
  event_category: string;
  event_action: string;
  event_label?: string;
  event_value?: number;
  user_id?: string;
  timestamp: string;
  page_path: string;
  page_title: string;
  [key: string]: unknown;
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

// Helper para push directo al dataLayer
const pushToDataLayer = (data: Record<string, unknown>): void => {
  if (isDataLayerAvailable()) {
    window.dataLayer.push({
      ...data,
      timestamp: new Date().toISOString(),
    });
    console.debug('[Analytics] DataLayer push:', data);
  }
};

// Create standardized GTM event structure
const createGTMEvent = (
  eventName: string,
  category: string,
  action: string,
  params?: EventParams
): GTMEvent => {
  return {
    event: eventName,
    event_category: category,
    event_action: action,
    event_label: params?.label as string,
    event_value: params?.value as number,
    timestamp: new Date().toISOString(),
    page_path: typeof window !== 'undefined' ? window.location.pathname : '',
    page_title: typeof document !== 'undefined' ? document.title : '',
    ...params,
  };
};

// Predefined conversion values for Google Ads
const getConversionValue = (type: ConversionType): number => {
  const values: Record<ConversionType, number> = {
    sign_up: 5,
    login: 1,
    analysis_started: 10,
    analysis_completed: 25,
    free_analysis_started: 2,
    free_analysis_completed: 8,
    purchase_intent: 39,
    lead_captured: 15,
    contact_submitted: 10,
    contract_generated: 20,
    onboarding_completed: 5,
    cta_clicked: 1,
    download_completed: 3,
    scroll_milestone: 0,
  };
  return values[type] || 0;
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

  const conversionValue = params?.value as number || getConversionValue(conversionType);

  const conversionParams = {
    event_category: 'conversion',
    event_label: conversionType,
    ...params,
    timestamp: new Date().toISOString(),
  };

  window.gtag('event', conversionType, conversionParams);

  // Push structured event to dataLayer for GTM
  if (isDataLayerAvailable()) {
    const gtmEvent = createGTMEvent(
      conversionType,
      'conversion',
      conversionType,
      params
    );
    
    window.dataLayer.push({
      ...gtmEvent,
      // Campos específicos para configurar Variables en GTM
      conversion_type: conversionType,
      conversion_value: conversionValue,
      conversion_currency: 'EUR',
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
 * Track CTA button clicks
 */
export const trackCTAClick = (
  ctaName: string,
  destination: string,
  location: string
): void => {
  pushToDataLayer({
    event: 'cta_clicked',
    cta_name: ctaName,
    cta_destination: destination,
    cta_location: location,
    page_path: window.location.pathname,
  });

  trackConversion('cta_clicked', {
    label: ctaName,
    destination,
    location,
  });
};

/**
 * Track form starts (for funnel analysis)
 */
export const trackFormStart = (formName: string): void => {
  pushToDataLayer({
    event: 'form_start',
    form_name: formName,
    page_path: window.location.pathname,
  });
};

/**
 * Track form submissions
 */
export const trackFormSubmit = (
  formName: string,
  success: boolean,
  errorMessage?: string
): void => {
  pushToDataLayer({
    event: 'form_submit',
    form_name: formName,
    form_success: success,
    form_error: errorMessage,
    page_path: window.location.pathname,
  });
};

/**
 * Track scroll depth milestones
 */
export const trackScrollDepth = (
  percentage: number,
  pagePath?: string
): void => {
  pushToDataLayer({
    event: 'scroll_depth',
    scroll_percentage: percentage,
    page_path: pagePath || window.location.pathname,
  });
};

/**
 * Track add to cart / checkout intent
 */
export const trackCheckoutIntent = (
  productId: string,
  productName: string,
  price: number,
  currency: string = 'EUR'
): void => {
  pushToDataLayer({
    event: 'begin_checkout',
    ecommerce: {
      currency,
      value: price,
      items: [{
        item_id: productId,
        item_name: productName,
        price,
        quantity: 1,
      }],
    },
  });

  trackConversion('purchase_intent', {
    product_id: productId,
    product_name: productName,
    value: price,
  });
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

/**
 * Track file upload events
 */
export const trackFileUpload = (
  fileName: string,
  fileType: string,
  fileSize: number,
  context: string
): void => {
  pushToDataLayer({
    event: 'file_upload',
    file_name: fileName,
    file_type: fileType,
    file_size_kb: Math.round(fileSize / 1024),
    upload_context: context,
    page_path: window.location.pathname,
  });
};

/**
 * Track error events for debugging
 */
export const trackError = (
  errorType: string,
  errorMessage: string,
  context?: string
): void => {
  pushToDataLayer({
    event: 'error',
    error_type: errorType,
    error_message: errorMessage,
    error_context: context,
    page_path: window.location.pathname,
  });
};
