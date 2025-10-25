import { supabase } from './supabase';
import { getCurrentUserId } from './auth';

export async function upsertProfile(input = {}) {
  const user_id = input.user_id || (await getCurrentUserId());
  if (!user_id) throw new Error('Missing user_id in profile payload');

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