import { supabase } from "./supabase";
import { getCurrentSessionUser as getUser } from "./auth";

/**
 * Get the current authenticated user session
 * @returns {Promise<{user: Object|null, session: Object|null}>}
 */
export async function getSessionUser() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Session error:", error);
      throw error;
    }

    return {
      user: session?.user || null,
      session: session
    };
  } catch (error) {
    console.error("Failed to get session user:", error);
    throw error;
  }
}

/**
 * Get the current user with fresh token validation
 * @returns {Promise<Object|null>}
 */
export async function getCurrentSessionUser() {
  try {
    const user = await getUser(); // imported from auth.js
    if (!user) {
      console.error("No current user found");
      return null;
    }
    return user;
  } catch (error) {
    console.error("Failed to get current user:", error);
    throw error;
  }
}

/**
 * Set up authentication state change listener
 * @param {Function} callback - Function to call when auth state changes
 * @returns {Function} - Unsubscribe function
 */
export function onAuthChange(callback) {
  if (typeof callback !== 'function') {
    throw new Error("Callback must be a function");
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      try {
        // Provide detailed event information
        const eventData = {
          event,
          session,
          user: session?.user || null,
          isAuthenticated: !!session,
          timestamp: new Date().toISOString()
        };

        // Log auth events for debugging (remove in production)
        console.log("Auth state change:", eventData);

        // Call the provided callback with event data
        await callback(eventData);
      } catch (error) {
        console.error("Error in auth state change callback:", error);
      }
    }
  );

  // Return unsubscribe function
  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Sign out the current user
 * @returns {Promise<void>}
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw error;
    }

    console.log("User signed out successfully");
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
}

/**
 * Refresh the current session
 * @returns {Promise<Object>}
 */
export async function refreshSession() {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Session refresh error:", error);
    throw error;
  }
}

/**
 * Check if user has a valid session
 * @returns {Promise<boolean>}
 */
export async function hasValidSession() {
  try {
    const { session } = await getSessionUser();
    return !!session && new Date(session.expires_at * 1000) > new Date();
  } catch (error) {
    console.error("Session validation error:", error);
    return false;
  }
}

/**
 * Get session expiry information
 * @returns {Promise<{expiresAt: Date|null, isExpired: boolean, timeUntilExpiry: number|null}>}
 */
export async function getSessionExpiry() {
  try {
    const { session } = await getSessionUser();
    
    if (!session) {
      return {
        expiresAt: null,
        isExpired: true,
        timeUntilExpiry: null
      };
    }

    const expiresAt = new Date(session.expires_at * 1000);
    const now = new Date();
    const isExpired = expiresAt <= now;
    const timeUntilExpiry = isExpired ? 0 : expiresAt.getTime() - now.getTime();

    return {
      expiresAt,
      isExpired,
      timeUntilExpiry
    };
  } catch (error) {
    console.error("Session expiry check error:", error);
    return {
      expiresAt: null,
      isExpired: true,
      timeUntilExpiry: null
    };
  }
}