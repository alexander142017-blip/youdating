import { supabase } from './supabase';

/**
 * Get a user profile by user ID
 * Replaces: base44.entities.Profiles.get() or similar
 */
export async function getProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getProfile:', error);
    return null;
  }
}

/**
 * Update or insert a user profile
 * Replaces: base44.auth.updateMe() and base44.entities.Profiles.update()
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
      console.error('Error upserting profile:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in upsertProfile:', error);
    throw error;
  }
}

/**
 * Mark user onboarding as complete
 * Replaces: base44.entities.Users.update({ onboardingComplete: true })
 */
export async function markOnboardingComplete(userId) {
  try {
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
      console.error('Error marking onboarding complete:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in markOnboardingComplete:', error);
    throw error;
  }
}

/**
 * List all user profiles (for admin/discovery)
 * Replaces: base44.entities.User.list()
 */
export async function listProfiles(filters = {}) {
  try {
    let query = supabase.from('profiles').select('*');

    // Apply filters if provided
    if (filters.gender) {
      query = query.eq('gender', filters.gender);
    }
    if (filters.looking_for) {
      query = query.eq('looking_for', filters.looking_for);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error listing profiles:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in listProfiles:', error);
    return [];
  }
}
