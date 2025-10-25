import { supabase } from './supabase';

// Central, schema-aligned upsert.
// payload must include: user_id, and only real columns from `public.profiles`.
export async function upsertProfile(payload) {
  if (!payload?.user_id) {
    throw new Error('Missing user_id in profile payload');
  }

  // Only keep whitelisted columns to avoid 400s from PostgREST
  const clean = {
    user_id: payload.user_id,
    email: payload.email ?? null,
    full_name: payload.full_name ?? null,
    onboarding_complete: !!payload.onboarding_complete,
    city: payload.city ?? null,
    lat: payload.lat ?? null,
    lng: payload.lng ?? null,
    bio: payload.bio ?? null,
    photos: Array.isArray(payload.photos) ? payload.photos : [],
  };

  console.log('[SAVE PROFILE] payload', clean);

  const { data, error } = await supabase
    .from('profiles')
    .upsert([clean], { onConflict: 'user_id', ignoreDuplicates: false })
    .select();

  if (error) {
    console.error('[UPsert Profile] error:', error);
    throw error;
  }
  return data?.[0] ?? null;
}

// Fetch profile by current user_id (helper for pages)
export async function fetchMyProfile(user_id) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user_id)
    .single();

  // Ignore "no rows" errors by checking code and message (code can vary by version)
  if (
    error &&
    !(
      error.code === 'PGRST116' ||
      (typeof error.message === 'string' && error.message.toLowerCase().includes('no rows'))
    )
  ) {
    console.error('[Fetch Profile] error:', error);
    throw error;
  }
  return data ?? null;
}