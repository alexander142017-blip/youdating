import { supabase } from './supabase';

/**
 * Get a user profile by userId or email
 * @param {Object} params - Query parameters
 * @param {string} [params.userId] - User ID to query
 * @param {string} [params.email] - Email to query
 * @returns {Promise<Object>} Profile object
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
    throw error;
  }

  return data;
}

/**
 * Create or update a user profile
 * @param {Object} profile - Profile data to upsert
 * @returns {Promise<Object>} Updated profile object
 */
export async function upsertProfile(profile) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Not authenticated');
  }

  const profileData = {
    ...profile,
    id: profile.id || user.id,
    email: profile.email || user.email,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(profileData, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Mark user's onboarding as complete
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated profile object
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
