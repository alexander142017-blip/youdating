import { supabase } from './supabase';
import { getCurrentSessionUser } from './session';
import { validateUserSession, executeWithErrorHandling } from '../utils/rlsErrorHandler';

/**
 * Get profile by userId or email.
 */
export async function getProfile({ userId, email }) {
  return executeWithErrorHandling(async () => {
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
  }, 'profile retrieval');
}

/**
 * Upsert profile (insert or update) - RLS compliant.
 */
export async function upsertProfile(profile) {
  return executeWithErrorHandling(async () => {
    // Get current session for RLS compliance
    const userId = await validateUserSession(supabase);

    // Ensure user_id is set for RLS and updated_at is current
    const profileData = {
      ...profile,
      user_id: userId,  // REQUIRED for RLS
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'user_id' })
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }, 'profile update');
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

/**
 * Complete user onboarding process with comprehensive data
 */
export async function completeOnboarding(onboardingData = {}) {
  try {
    const currentUser = await getCurrentSessionUser();
    if (!currentUser) {
      throw new Error("User must be authenticated to complete onboarding");
    }

    // Prepare onboarding completion data
    const completionData = {
      id: currentUser.id,
      email: currentUser.email,
      onboarding_complete: true,
      profile_completed: true,
      onboarding_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...onboardingData
    };

    const updatedProfile = await upsertProfile(completionData);
    
    console.log("Onboarding completed successfully for user:", currentUser.id);
    return updatedProfile;
  } catch (error) {
    console.error("Failed to complete onboarding:", error);
    throw error;
  }
}

/**
 * Get profile by ID (simplified version)
 */
export async function getProfileById(userId) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Failed to get profile by ID:", error);
    throw error;
  }
}

/**
 * Update profile photo URL
 */
export async function updateProfilePhoto(photoUrl) {
  if (!photoUrl || typeof photoUrl !== 'string') {
    throw new Error("Photo URL is required and must be a string");
  }

  try {
    const currentUser = await getCurrentSessionUser();
    if (!currentUser) {
      throw new Error("User must be authenticated to update photo");
    }

    const updatedProfile = await upsertProfile({
      id: currentUser.id,
      photo_url: photoUrl,
      has_photo: true
    });

    return updatedProfile;
  } catch (error) {
    console.error("Failed to update profile photo:", error);
    throw error;
  }
}

/**
 * Update user preferences
 */
export async function updatePreferences(preferences) {
  if (!preferences || typeof preferences !== 'object') {
    throw new Error("Preferences must be an object");
  }

  try {
    const currentUser = await getCurrentSessionUser();
    if (!currentUser) {
      throw new Error("User must be authenticated to update preferences");
    }

    const allowedPreferences = [
      'discovery_age_min',
      'discovery_age_max', 
      'discovery_max_distance',
      'show_on_discover',
      'show_distance',
      'show_age',
      'notification_matches',
      'notification_messages',
      'notification_likes'
    ];

    // Filter to only allowed preference keys
    const filteredPreferences = Object.keys(preferences)
      .filter(key => allowedPreferences.includes(key))
      .reduce((obj, key) => {
        obj[key] = preferences[key];
        return obj;
      }, {});

    if (Object.keys(filteredPreferences).length === 0) {
      throw new Error("No valid preferences provided");
    }

    const updatedProfile = await upsertProfile({
      id: currentUser.id,
      ...filteredPreferences
    });

    return updatedProfile;
  } catch (error) {
    console.error("Failed to update preferences:", error);
    throw error;
  }
}

/**
 * Search profiles for discovery
 */
export async function searchProfiles(filters = {}) {
  try {
    const currentUser = await getCurrentSessionUser();
    if (!currentUser) {
      throw new Error("User must be authenticated to search profiles");
    }

    const {
      ageMin = 18,
      ageMax = 99,
      maxDistance = 50, // TODO: Implement distance filtering
      limit = 10,
      offset = 0
    } = filters;

    let query = supabase
      .from('profiles')
      .select('*')
      .eq('show_on_discover', true)
      .eq('onboarding_complete', true)
      .neq('id', currentUser.id); // Exclude current user

    // Add age filters if age is available
    if (ageMin) {
      query = query.gte('age', ageMin);
    }
    if (ageMax) {
      query = query.lte('age', ageMax);
    }

    // Add pagination
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Failed to search profiles:", error);
    throw error;
  }
}