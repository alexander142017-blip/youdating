import { supabase } from './supabase';

/**
 * Get a user profile by userId or email
 * @param {Object} params - Search parameters
 * @param {string} params.userId - User ID to search for
 * @param {string} params.email - Email to search for
 * @returns {Promise<Object>} User profile
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

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Create or update a user profile
 * @param {Object} profile - Profile data to upsert
 * @returns {Promise<Object>} Upserted profile
 */
export async function upsertProfile(profile) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

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
    .update({ onboarding_completed: true })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
