import { supabase } from './supabase';

export async function upsertProfile(input) {
  const payload = {
    user_id: input.user_id, // REQUIRED
    email: input.email ?? null,
    full_name: input.full_name ?? null,
    onboarding_complete: !!input.onboarding_complete,
    city: input.city ?? null,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    bio: input.bio ?? null,
    photos: Array.isArray(input.photos) ? input.photos : [],
  };

  if (!payload.user_id) throw new Error('Missing user_id in profile payload');

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

export async function fetchProfileByUserId(user_id) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user_id)
    .single();

  if (error && error.code !== 'PGRST116') { // 406/No rows, adjust if needed
    console.error('[profiles.fetchProfileByUserId] error:', error);
    throw error;
  }
  return data ?? null;
}