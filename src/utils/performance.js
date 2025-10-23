/**
 * Performance Utilities
 * 
 * Utilities to improve app performance, reduce bundle size,
 * and optimize React component rendering.
 */

import { lazy } from 'react';

/**
 * Create a lazy-loaded component with error boundary
 * @param {Function} importFunc - Dynamic import function
 * @param {string} componentName - Name for debugging
 * @returns {React.LazyExoticComponent}
 */
export function createLazyComponent(importFunc, componentName = 'Component') {
  const LazyComponent = lazy(() => 
    importFunc().catch(err => {
      console.error(`Failed to load ${componentName}:`, err);
      // Return a fallback component
      return {
        default: () => (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Unable to load component
              </h2>
              <p className="text-gray-600">Please refresh the page to try again.</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )
      };
    })
  );
  
  LazyComponent.displayName = `Lazy(${componentName})`;
  return LazyComponent;
}

/**
 * Debounce function to limit API calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} - Throttled function
 */
export function throttle(func, limit = 100) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Optimize images by adding loading and sizing attributes
 * @param {string} src - Image source
 * @param {object} options - Image optimization options
 * @returns {object} - Optimized image props
 */
export function optimizeImageProps(src, options = {}) {
  const {
    width,
    height,
    alt = 'Image',
    loading = 'lazy',
    quality = 85,
    format = 'webp'
  } = options;

  const optimizedSrc = src.includes('supabase') 
    ? `${src}?quality=${quality}&format=${format}${width ? `&width=${width}` : ''}${height ? `&height=${height}` : ''}`
    : src;

  return {
    src: optimizedSrc,
    alt,
    loading,
    ...(width && { width }),
    ...(height && { height }),
    decoding: 'async',
    style: { aspectRatio: width && height ? `${width}/${height}` : undefined }
  };
}

/**
 * Create a memoized selector for React Query data
 * @param {Function} selector - Function to select data
 * @returns {Function} - Memoized selector
 */
export function createMemoizedSelector(selector) {
  let lastArgs = [];
  let lastResult;
  
  return (...args) => {
    // Simple shallow comparison
    if (args.length !== lastArgs.length || 
        args.some((arg, index) => arg !== lastArgs[index])) {
      lastArgs = args;
      lastResult = selector(...args);
    }
    return lastResult;
  };
}

/**
 * Preload route component
 * @param {Function} importFunc - Dynamic import function
 */
export function preloadRoute(importFunc) {
  // Start loading the component when function is called
  const componentImport = importFunc();
  
  // Return a function that can be called to get the loaded component
  return () => componentImport;
}

/**
 * Create intersection observer for lazy loading
 * @param {Function} callback - Callback when element is visible
 * @param {object} options - Intersection observer options
 * @returns {IntersectionObserver} - Observer instance
 */
export function createIntersectionObserver(callback, options = {}) {
  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };

  return new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry.target);
      }
    });
  }, defaultOptions);
}