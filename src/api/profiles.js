import { supabase } from './supabase';

/**
 * Get a profile by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Profile object or null if not found
 */
export async function getProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
}

/**
 * Create or update a profile
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data to upsert
 * @returns {Promise<Object>} Upserted profile object
 */
export async function upsertProfile(userId, profileData) {
  try {
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
  } catch (error) {
    console.error('Error upserting profile:', error);
    throw error;
  }
}

/**
 * Mark onboarding as complete for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated profile object
 */
export async function markOnboardingComplete(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        profile_completed: true,
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error marking onboarding complete:', error);
    throw error;
  }
}

/**
 * Update a user's profile
 * @param {string} userId - User ID
 * @param {Object} updates - Profile updates
 * @returns {Promise<Object>} Updated profile object
 */
export async function updateProfile(userId, updates) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}
