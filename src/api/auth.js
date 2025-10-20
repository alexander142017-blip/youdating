import { supabase } from './supabase';

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  return { ...user, ...(profile || {}) };
}
