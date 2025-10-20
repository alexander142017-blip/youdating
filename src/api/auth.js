import { supabase } from './supabase.js';

/**
 * Get the current authenticated user
 * @returns {Promise<Object>} Current user object
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Not authenticated');
  }

  // Fetch user profile data from profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    // PGRST116 is "no rows returned" - acceptable for new users
    console.error('Error fetching profile:', profileError);
  }

  // Merge auth user with profile data
  return {
    id: user.id,
    email: user.email,
    ...profile,
  };
}

/**
 * Update the current user's profile
 * @param {Object} data - Profile data to update
 * @returns {Promise<Object>} Updated user object
 */
export async function updateCurrentUser(data) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  // Update profile in profiles table
  const { data: profile, error: updateError } = await supabase
    .from('profiles')
    .upsert({ id: user.id, ...data, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (updateError) {
    throw updateError;
  }

  return {
    id: user.id,
    email: user.email,
    ...profile,
  };
}

/**
 * Sign out the current user
 * @returns {Promise<void>}
 */
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}
