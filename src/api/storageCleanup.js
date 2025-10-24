// Integration guide for YouDating app
// Add this to your user deletion/account management logic

import { supabase } from '@/api/supabase';

/**
 * Clean up user profile photos using the Edge Function
 * Call this before deleting a user's profile from the database
 */
export async function cleanupUserStorage(userId) {
  try {
    console.log(`[CLEANUP] Starting storage cleanup for user: ${userId}`);
    
    const { data, error } = await supabase.functions.invoke('storage-cleanup', {
      body: { user_id: userId }
    });
    
    if (error) {
      console.error('[CLEANUP] Storage cleanup failed:', error);
      throw error;
    }
    
    console.log(`[CLEANUP] Successfully deleted ${data.deleted} profile photos`);
    return data;
    
  } catch (error) {
    console.error('[CLEANUP] Error during storage cleanup:', error);
    throw error;
  }
}

// Example usage in your existing profile deletion flow:
// 
// In src/api/profiles.js, you could add:
//
// export async function deleteUserProfile(userId) {
//   try {
//     // Clean up storage first
//     await cleanupUserStorage(userId);
//     
//     // Then delete profile from database
//     const { error } = await supabase
//       .from('profiles')
//       .delete()
//       .eq('user_id', userId);
//     
//     if (error) throw error;
//     
//     return { success: true };
//   } catch (error) {
//     console.error('Failed to delete user profile:', error);
//     throw error;
//   }
// }