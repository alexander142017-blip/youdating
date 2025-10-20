import { supabase } from './supabase';

/**
 * Get the current authenticated user with their profile data
 * @returns {Promise<Object|null>} User object with profile data or null if not authenticated
 */
export async function getCurrentUser() {
  try {
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return null;
    }

    const user = session.user;

    // Fetch user's profile from the profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      // Return basic user data even if profile fetch fails
      return {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0],
        profile_completed: false,
      };
    }

    // Merge user and profile data
    return {
      id: user.id,
      email: user.email,
      ...profile,
      name: profile.name || user.user_metadata?.name || user.email?.split('@')[0],
    };
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}

/**
 * Update the current user's data
 * @param {Object} data - Data to update
 * @returns {Promise<Object>} Updated user object
 */
export async function updateCurrentUser(data) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }

    const userId = session.user.id;

    // Update the profile in the database
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      id: userId,
      email: session.user.email,
      ...updatedProfile,
    };
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
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
      throw error;
    }
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
}
