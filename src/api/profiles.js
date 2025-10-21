import { supabase } from './supabase';

/**
 * Get profile by userId or email.
 */
export async function getProfile({ userId, email }) {
  if (userId) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) throw error;
    return data;
  }
  if (email) {
    const { data, error } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
    if (error) throw error;
    return data;
  }
  return null;
}

/**
 * Upsert profile (insert or update).
 */
export async function upsertProfile(profile) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'id' })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Mark onboarding complete for a user.
 */
export async function markOnboardingComplete(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ profile_completed: true })
    .eq('id', userId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}