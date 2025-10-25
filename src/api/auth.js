import { supabase } from './supabase';

// Returns the full Supabase user object (or null)
export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
}

// Returns the authed user's UUID (or null)
export async function getCurrentUserId() {
  const user = await getCurrentUser();
  return user?.id ?? null;
}

// Optional helper: throws when no user
export async function requireUserId() {
  const id = await getCurrentUserId();
  if (!id) throw new Error('No authenticated user. Please sign in again.');
  return id;
}