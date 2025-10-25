import { supabase } from './supabase';

/**
 * Returns the full Supabase user (or null)
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error('[auth.getCurrentUser] error:', error);
    return null;
  }
  return data?.user ?? null;
}

/**
 * Returns the current user id (or null)
 */
export async function getCurrentUserId() {
  const user = await getCurrentUser();
  return user?.id ?? null;
}

/**
 * Minimal identity you can safely pass around
 */
export async function getAuthedIdentity() {
  const user = await getCurrentUser();
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? null,
  };
}

/**
 * Utility guards
 */
export async function requireUserId() {
  const id = await getCurrentUserId();
  if (!id) throw new Error('Not authenticated');
  return id;
}