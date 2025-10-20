import { supabase } from './supabase';

/**
 * Return the current authenticated user profile.
 * Combines Supabase auth user and the profiles row if present.
 */
export async function getCurrentUser() {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  // profile may be null if not created yet
  return {
    ...user,
    ...(profile || {})
  };
}