import { supabase } from './supabase';

export type ProfileInput = {
  user_id: string;
  email?: string | null;
  full_name?: string | null;
  onboarding_complete?: boolean;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
  bio?: string | null;
  photos?: string[]; // array of public URLs
};

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // 116 = not found
    console.error('[GET Profile] error:', error);
    throw error;
  }
  return data ?? null;
}

export async function upsertProfile(input: ProfileInput) {
  const payload = {
    user_id: input.user_id,
    email: input.email ?? null,
    full_name: input.full_name ?? null,
    onboarding_complete: !!input.onboarding_complete,
    city: input.city ?? null,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    bio: input.bio ?? null,
    photos: Array.isArray(input.photos) ? input.photos : [],
  };

  if (!payload.user_id) {
    throw new Error('Missing user_id in profile payload');
  }

  // helpful debug
  console.log('[SAVE PROFILE] payload', payload);

  const { data, error } = await supabase
    .from('profiles')
    .upsert([payload], { onConflict: 'user_id', ignoreDuplicates: false })
    .select();

  if (error) {
    console.error('[UPSERT Profile] error:', error);
    throw error;
  }
  return data?.[0] ?? null;
}