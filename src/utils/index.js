/**
 * Create a page URL for routing
 * @param {string} pageName - The page name
 * @returns {string} - The page URL path
 */
export function createPageUrl(pageName) {
  return `/${pageName.toLowerCase()}`;
}