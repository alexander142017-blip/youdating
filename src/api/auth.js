import { supabase } from './supabase';

/**
 * Get the current authenticated user with their profile data
 * @returns {Promise<Object>} User object with profile data merged
 */
export async function getCurrentUser() {
  // Get authenticated user from Supabase Auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  // Fetch profile data from profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    // PGRST116 is "not found", which is okay for new users
    console.warn('Error fetching profile:', profileError);
  }

  // Merge auth user with profile data
  return {
    id: user.id,
    email: user.email,
    name: profile?.full_name || user.user_metadata?.full_name || '',
    full_name: profile?.full_name || user.user_metadata?.full_name || '',
    ...profile,
    // Premium fields for compatibility
    isPremium: profile?.is_premium || false,
    premiumPlan: profile?.premium_plan || null,
    premiumExpiresAt: profile?.premium_expires_at || null,
  };
}
