import { supabase } from './supabase.js';
import { getCurrentSessionUser } from './session';
import { validateUserSession, executeWithErrorHandling, explainSupabaseError } from '../utils/rlsErrorHandler.js';

/**
 * Get profile by userId or email.
 */
export async function getProfile({ userId, email }) {
  return executeWithErrorHandling(async () => {
    if (userId) {
      const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
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
 * Create or update profile with strict validation and proper error handling
 * @param {Object} payload - Profile data to save
 * @returns {Promise<Object>} - Created/updated profile
 */
export async function upsertProfile(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('upsertProfile requires a valid payload object');
  }

  return executeWithErrorHandling(async () => {
    const session = await validateUserSession();
    const userId = session.user.id;
    
    const sanitizedPayload = {
      ...payload,
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    // Remove undefined values to prevent database errors
    Object.keys(sanitizedPayload).forEach(key => {
      if (sanitizedPayload[key] === undefined) {
        delete sanitizedPayload[key];
      }
    });

    console.log(`[upsertProfile] Saving profile for user ${userId}:`, sanitizedPayload);

    const { data, error } = await supabase
      .from('profiles')
      .upsert(sanitizedPayload, { 
        onConflict: 'user_id',
        count: 'exact'
      })
      .select('*')
      .single();

    if (error) {
      console.error('[upsertProfile] Supabase error:', explainSupabaseError(error));
      throw error;
    }

    if (!data) {
      throw new Error('upsertProfile returned no data despite no error');
    }

    console.log(`[upsertProfile] Successfully saved profile:`, data);
    return data;
  }, 'upsert profile');
}

/**
 * Alternative profile save using explicit update-then-insert fallback
 * Useful for teams preferring explicit operation control over upsert
 * @param {Object} payload - Profile data to save
 * @returns {Promise<Object>} - Created/updated profile
 */
export async function saveProfile(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('saveProfile requires a valid payload object');
  }

  return executeWithErrorHandling(async () => {
    const session = await validateUserSession();
    const userId = session.user.id;
    
    const sanitizedPayload = {
      ...payload,
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    // Remove undefined values
    Object.keys(sanitizedPayload).forEach(key => {
      if (sanitizedPayload[key] === undefined) {
        delete sanitizedPayload[key];
      }
    });

    console.log(`[saveProfile] Attempting save for user ${userId}:`, sanitizedPayload);

    // Try update first
    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .update(sanitizedPayload)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (!updateError && updateData) {
      console.log(`[saveProfile] Successfully updated profile:`, updateData);
      return updateData;
    }

    console.log(`[saveProfile] Update failed, attempting insert:`, updateError?.message);

    // Fallback to insert with required fields
    const insertPayload = {
      ...sanitizedPayload,
      email: sanitizedPayload.email || session.user.email,
      created_at: new Date().toISOString(),
    };

    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert(insertPayload)
      .select('*')
      .single();

    if (insertError) {
      console.error('[saveProfile] Both update and insert failed:', {
        updateError: explainSupabaseError(updateError),
        insertError: explainSupabaseError(insertError)
      });
      throw insertError;
    }

    if (!insertData) {
      throw new Error('saveProfile insert returned no data despite no error');
    }

    console.log(`[saveProfile] Successfully inserted profile:`, insertData);
    return insertData;
  }, 'save profile');
}

/**
 * Mark onboarding complete for a user.
 */
export async function markOnboardingComplete(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ profile_completed: true })
    .eq('user_id', userId)
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
      user_id: currentUser.id,
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
      .eq('user_id', userId)
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
      user_id: currentUser.id,
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
      user_id: currentUser.id,
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
      // maxDistance = 50, // TODO: Implement distance filtering
      limit = 10,
      offset = 0
    } = filters;

    let query = supabase
      .from('profiles')
      .select('*')
      .eq('show_on_discover', true)
      .eq('onboarding_complete', true)
      .neq('user_id', currentUser.id); // Exclude current user

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