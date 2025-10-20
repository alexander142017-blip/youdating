import { supabase } from './supabase';

export async function getProfile({ userId, email }) {
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
}

export async function upsertProfile(profile) {
  const { data, error } = await supabase.from('profiles').upsert(profile, { onConflict: 'id' }).select().maybeSingle();
  if (error) throw error;
  return data;
}

export async function markOnboardingComplete(userId) {
  const { data, error } = await supabase.from('profiles').update({ profile_completed: true }).eq('id', userId).select().maybeSingle();
  if (error) throw error;
  return data;
}
