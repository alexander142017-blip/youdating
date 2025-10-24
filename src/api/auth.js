import { supabase } from './supabase';

/**
 * Return the current authenticated user profile.
 * Combines Supabase auth user and the profiles row if present.
 */
export async function getCurrentUser() {
  const { data: { user } = {}, error: authErr } = await supabase.auth.getUser();
  if (authErr) {
    // don't throw here — allow callers to handle null user
    console.warn('supabase.auth.getUser error', authErr);
  }
  if (!user) return null;

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (profileErr) console.warn('failed to load profile', profileErr);

  return {
    ...user,
    ...(profile || {})
  };
}