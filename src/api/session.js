import { supabase } from './supabase';
import { getCurrentUser, getCurrentUserId, getAuthedIdentity } from './auth';

export { getCurrentUser, getCurrentUserId, getAuthedIdentity };

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('[session.getSession] error:', error);
    return null;
  }
  return data?.session ?? null;
}

export function onAuthStateChange(callback) {
  const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
    try {
      callback({ event, session });
    } catch (e) {
      console.error('[session.onAuthStateChange] callback error:', e);
    }
  });
  return () => subscription?.unsubscribe?.();
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('[session.signOut] error:', error);
    throw error;
  }
  return true;
}