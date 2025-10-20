import { supabase } from './supabase';

/**
 * Get the current authenticated user along with their profile
 * @returns {Promise<Object>} User object with auth data and profile
 */
export async function getCurrentUser() {
  // Get auth user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error(authError?.message || 'Not authenticated');
  }

  // Get user profile from profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    // PGRST116 is "not found" error, which is acceptable for new users
    console.error('Profile fetch error:', profileError);
  }

  // Merge auth user and profile data
  return {
    id: user.id,
    email: user.email,
    ...profile,
  };
}

/**
 * Update the current user's profile
 * @param {Object} updates - Profile fields to update
 * @returns {Promise<Object>} Updated profile
 */
export async function updateMe(updates) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error(authError?.message || 'Not authenticated');
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, ...updates })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Sign out the current user
 * @returns {Promise<void>}
 */
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

// Export an object similar to base44.auth for easier migration
export const auth = {
  me: getCurrentUser,
  updateMe,
  logout,
};
