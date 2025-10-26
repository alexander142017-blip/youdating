import { supabase } from './supabase';

/**
 * Returns the current session or null, never throws
 */
export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('[auth.getSession] error:', error);
      return null;
    }
    return data?.session ?? null;
  } catch (err) {
    console.warn('[auth.getSession] error:', err);
    return null;
  }
}

/**
 * Returns the current user or null, never throws
 */
export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.warn('[auth.getCurrentUser] error:', error);
      return null;
    }
    return data?.user ?? null;
  } catch (err) {
    console.warn('[auth.getCurrentUser] error:', err);
    return null;
  }
}

/**
 * Returns the current user id or null, never throws
 */
export async function getCurrentUserId() {
  try {
    const user = await getCurrentUser();
    return user?.id ?? null;
  } catch (err) {
    console.warn('[auth.getCurrentUserId] error:', err);
    return null;
  }
}

/**
 * Subscribe to auth state changes, returns unsubscribe function
 */
export function onAuthStateChange(callback) {
  try {
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        const user = session?.user ?? null;
        await callback({ event, session, user });
      } catch (err) {
        console.warn('[auth.onAuthStateChange:callback] error:', err);
      }
    });
    return data.subscription.unsubscribe;
  } catch (err) {
    console.warn('[auth.onAuthStateChange] error:', err);
    return () => {}; // Safe no-op unsubscribe
  }
}

/**
 * Safe sign out wrapper
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn('[auth.signOut] error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[auth.signOut] error:', err);
    return false;
  }
}