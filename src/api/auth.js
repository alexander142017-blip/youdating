import { supabase } from './supabase';

/**
 * Get the current authenticated user with their profile data
 * Replaces: base44.auth.me()
 */
export async function getCurrentUser() {
  try {
    // Get the authenticated user from Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return null;
    }

    // Fetch the user's profile data from the profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      // Return basic user info even if profile doesn't exist yet
      return {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email,
        profile_completed: false,
      };
    }

    // Merge auth user data with profile data
    return {
      id: user.id,
      email: user.email,
      ...profile,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Log out the current user
 * Replaces: base44.auth.logout()
 */
export async function logout() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
}
