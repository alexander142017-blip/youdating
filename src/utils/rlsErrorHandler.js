/**
 * Standardized RLS Error Handler
 * 
 * Provides consistent error handling for row-level security policy violations
 * across all Supabase API operations.
 */

/**
 * Handle RLS and other Supabase errors with user-friendly messages
 * @param {Error} error - The original Supabase error
 * @param {string} operation - Description of the operation that failed
 * @returns {Error} - Standardized error with user-friendly message
 */
export function handleSupabaseError(error, operation = 'database operation') {
  console.error(`Supabase error during ${operation}:`, error);
  
  const errorMessage = error?.message?.toLowerCase() || '';
  
  // RLS policy violations
  if (errorMessage.includes('row-level security') || 
      errorMessage.includes('policy') ||
      errorMessage.includes('permission denied')) {
    return new Error('Please sign in again and retry. Your session may have expired.');
  }
  
  // Network/connection errors
  if (errorMessage.includes('network') || 
      errorMessage.includes('fetch') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout')) {
    return new Error('Network error. Please check your connection and try again.');
  }
  
  // Authentication errors
  if (errorMessage.includes('jwt') || 
      errorMessage.includes('token') ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('authentication')) {
    return new Error('Authentication failed. Please sign in again.');
  }
  
  // Validation errors
  if (errorMessage.includes('invalid') || 
      errorMessage.includes('constraint') ||
      errorMessage.includes('duplicate') ||
      errorMessage.includes('unique')) {
    return new Error(`Invalid data provided. ${error.message}`);
  }
  
  // Database errors
  if (errorMessage.includes('database') || 
      errorMessage.includes('relation') ||
      errorMessage.includes('column')) {
    return new Error('Database error occurred. Please try again later.');
  }
  
  // Default fallback
  return new Error(`Failed to complete ${operation}. Please try again.`);
}

/**
 * Validate user session for RLS compliance
 * @param {object} supabase - Supabase client instance
 * @returns {Promise<string>} - User ID if valid session
 * @throws {Error} - If no valid session
 */
export async function validateUserSession(supabase) {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    throw handleSupabaseError(error, 'session validation');
  }
  
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error('Please sign in to continue');
  }
  
  return userId;
}

/**
 * Execute Supabase operation with standardized error handling
 * @param {Function} operation - Async function that performs Supabase operation
 * @param {string} operationName - Description of the operation
 * @returns {Promise} - Result of the operation
 */
export async function executeWithErrorHandling(operation, operationName = 'operation') {
  try {
    return await operation();
  } catch (error) {
    throw handleSupabaseError(error, operationName);
  }
}

/**
 * Get detailed error information from Supabase errors
 * @param {Error} error - Supabase error object
 * @returns {string} - Formatted error details
 */
export function explainSupabaseError(error) {
  if (!error) return 'Unknown error';
  const { code, message, details, hint } = error;
  return `[${code || 'ERR'}] ${message || 'No message'}
  ${details ? `details: ${details}` : ''}
  ${hint ? `hint: ${hint}` : ''}`;
}