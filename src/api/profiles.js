// src/api/profiles.js
import { supabase } from './supabase';
import { getCurrentUserId } from './auth';

/**
 * Get a profile by user_id or email
 */
export async function getProfile({ userId, email }) {
  if (userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    return data;
  }
  if (email) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();
    if (error) throw error;
    return data;
  }
  return null;
}

/**
 * Upsert current user's profile. Ensures user_id is present.
 * Only valid columns are sent to the DB.
 */
export async function upsertProfile(input = {}) {
  const user_id = input.user_id ?? (await getCurrentUserId());
  if (!user_id) {
    console.error('[UPsert Profile] missing user_id; input=', input);
    throw new Error('Missing user_id in profile payload');
  }

  const payload = {
    user_id,
    email: input.email ?? null,
    full_name: input.full_name ?? null,
    onboarding_complete: !!input.onboarding_complete,
    city: input.city ?? null,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    bio: input.bio ?? null,
    photos: Array.isArray(input.photos) ? input.photos : [],
  };

  console.log('[SAVE PROFILE] payload', payload);

  const { data, error } = await supabase
    .from('profiles')
    .upsert([payload], { onConflict: 'user_id', ignoreDuplicates: false })
    .select();

  if (error) {
    console.error('[UPsert Profile] error:', error);
    throw error;
  }
  return data?.[0] ?? null;
}

/**
 * Get the current user's profile (or null).
 */
export async function getMyProfile() {
  const user_id = await getCurrentUserId();
  if (!user_id) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user_id)
    .single();

  if (error) {
    console.error('[getMyProfile] error:', error);
    return null;
  }
  return data;
}