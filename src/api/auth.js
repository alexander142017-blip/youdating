import { supabase } from './supabase';

/**
 * Get the current authenticated user with their profile data
 * @returns {Promise<Object>} User object with auth data and profile
 */
export async function getCurrentUser() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error(authError?.message || 'Not authenticated');
  }

  // Fetch profile data from profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = not found
    console.error('Error fetching profile:', profileError);
  }

  // Merge auth user with profile data
  return {
    id: user.id,
    email: user.email,
    name: profile?.full_name || user.email,
    full_name: profile?.full_name,
    isPremium: profile?.is_premium || false,
    premiumPlan: profile?.premium_plan || null,
    premiumExpiresAt: profile?.premium_expires_at || null,
    ...profile
  };
}

/**
 * Update the current user's profile
 * @param {Object} data - Profile data to update
 * @returns {Promise<Object>} Updated profile
 */
export async function updateMe(data) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { data: updated, error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  
  return updated;
}

/**
 * Logout the current user
 * @returns {Promise<void>}
 */
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
