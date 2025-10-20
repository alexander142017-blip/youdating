import { supabase } from './supabase.js';

/**
 * Get the current authenticated user
 * @returns {Promise<Object|null>} User object or null
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    if (!user) {
      return null;
    }

    // Fetch user profile from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
    }

    // Merge auth user data with profile data
    return {
      id: user.id,
      email: user.email,
      name: profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      full_name: profile?.full_name || user.user_metadata?.full_name || '',
      bio: profile?.bio || '',
      interests: profile?.interests || [],
      photos: profile?.photos || [],
      isPremium: profile?.is_premium || false,
      premiumPlan: profile?.premium_plan || null,
      premiumExpiresAt: profile?.premium_expires_at || null,
      profile_completed: profile?.profile_completed || false,
      age: profile?.age || null,
      gender: profile?.gender || null,
      looking_for: profile?.looking_for || null,
      location: profile?.location || null,
      ...profile,
    };
  } catch (err) {
    console.error('Error in getCurrentUser:', err);
    return null;
  }
}

/**
 * Update the current user's profile
 * @param {Object} data - Profile data to update
 * @returns {Promise<Object>} Updated user object
 */
export async function updateMe(data) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Update user metadata if full_name is being updated
    if (data.full_name !== undefined) {
      await supabase.auth.updateUser({
        data: { full_name: data.full_name }
      });
    }

    // Update profile in profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        ...data,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileError) {
      throw profileError;
    }

    return {
      id: user.id,
      email: user.email,
      name: profile?.full_name || user.email?.split('@')[0] || 'User',
      ...profile,
    };
  } catch (err) {
    console.error('Error in updateMe:', err);
    throw err;
  }
}

/**
 * Logout the current user
 * @returns {Promise<void>}
 */
export async function logout() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error);
    }
  } catch (err) {
    console.error('Error in logout:', err);
  }
}
