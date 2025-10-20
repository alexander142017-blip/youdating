import { supabase } from './supabase.js';

/**
 * Get a user profile by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Profile object or null
 */
export async function getProfile(userId) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Profile not found
        return null;
      }
      throw error;
    }

    return profile;
  } catch (err) {
    console.error('Error in getProfile:', err);
    return null;
  }
}

/**
 * Create or update a user profile
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data to upsert
 * @returns {Promise<Object>} Upserted profile object
 */
export async function upsertProfile(userId, profileData) {
  try {
    const { data: profile, error } = await supabase
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

    return profile;
  } catch (err) {
    console.error('Error in upsertProfile:', err);
    throw err;
  }
}

/**
 * Mark onboarding as complete for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated profile object
 */
export async function markOnboardingComplete(userId) {
  try {
    const { data: profile, error } = await supabase
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

    return profile;
  } catch (err) {
    console.error('Error in markOnboardingComplete:', err);
    throw err;
  }
}
