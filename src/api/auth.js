import { supabase } from './supabase';

/**
 * Returns the current authed user (or null).
 * Safe for both client and server components.
 */
export async function getCurrentSessionUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error('[auth] getUser error:', error);
    return null;
  }
  return data?.user ?? null;
}

/**
 * Ensures a user is signed in, throws otherwise.
 */
export async function requireAuthedUser() {
  const user = await getCurrentSessionUser();
  if (!user) throw new Error('Not authenticated');
  return user;
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