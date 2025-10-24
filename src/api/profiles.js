import { supabase } from '../api/supabase';

export async function getProfile({ userId, email }) {
  if (userId) {
    const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
    if (error) throw error;
    return data;
  }
  if (email) {
    const { data, error } = await supabase.from('profiles').select('*').eq('email', email).single();
    if (error) throw error;
    return data;
  }
  return null;
}

export async function upsertProfile(input) {
  const payload = {
    user_id: input.user_id,               // required
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
  console.log('[SAVE PROFILE] payload', payload);

  const { data, error } = await supabase
    .from('profiles')
    .upsert([payload], { onConflict: 'user_id', ignoreDuplicates: false })
    .select();

  if (error) {
    console.error('[Upsert Profile] error:', error);
    throw error;
  }
  return data?.[0] ?? null;
}

export async function getProfileByUserId(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data;
}