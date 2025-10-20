import { supabase } from './supabase';

/**
 * Get a profile by userId or email
 * @param {Object} params - Query parameters
 * @param {string} params.userId - User ID to query
 * @param {string} params.email - Email to query
 * @returns {Promise<Object>} Profile data
 */
export async function getProfile({ userId, email }) {
  let query = supabase.from('profiles').select('*');
  
  if (userId) {
    query = query.eq('id', userId);
  } else if (email) {
    query = query.eq('email', email);
  } else {
    throw new Error('Either userId or email must be provided');
  }

  const { data, error } = await query.single();
  
  if (error) throw error;
  
  return data;
}

/**
 * Create or update a profile
 * @param {Object} profile - Profile data to upsert
 * @returns {Promise<Object>} Upserted profile
 */
export async function upsertProfile(profile) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  
  return data;
}

/**
 * Mark onboarding as complete for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated profile
 */
export async function markOnboardingComplete(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ onboarding_complete: true })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  
  return data;
}
