import { supabase } from './supabase';

/**
 * Returns the current authenticated user (or null) using Supabase v2 APIs.
 * This is the canonical helper used across the app.
 */
export async function getCurrentSessionUser() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('[auth] getSession error:', error);
    return null;
  }
  return data?.session?.user ?? null;
}

/**
 * Back-compat alias for older call sites.
 * Do NOT remove: kept to avoid breaking older imports. Prefer getCurrentSessionUser() moving forward.
 */
export async function getCurrentUser() {
  return getCurrentSessionUser();
}

/**
 * Convenience: get current user id (string | null)
 */
export async function getCurrentUserId() {
  const u = await getCurrentSessionUser();
  return u?.id ?? null;
}

/**
 * Subscribe to auth changes. Returns an unsubscribe function.
 */
export function onAuthChange(callback) {
  const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => sub?.subscription?.unsubscribe();
}

/**
 * Ensures a user is signed in, throws otherwise.
 */
export async function requireAuthedUser() {
  const user = await getCurrentSessionUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}