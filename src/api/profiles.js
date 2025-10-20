import { supabase } from './supabase.js';

/**
 * Get a user's profile by ID
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} User profile
 */
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Create or update a user's profile
 * @param {string} userId - The user's ID
 * @param {Object} profileData - Profile data to upsert
 * @returns {Promise<Object>} Updated profile
 */
export async function upsertProfile(userId, profileData) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      ...profileData,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Mark user's onboarding as complete
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} Updated profile
 */
export async function markOnboardingComplete(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      profile_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
