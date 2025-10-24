// Example usage of the storage-cleanup Edge Function
// This file demonstrates how to integrate the cleanup function into your app

import { supabase } from '@/api/supabase';

/**
 * Clean up all profile photos for a user
 * @param userId - The user ID whose photos should be deleted
 * @returns Promise with cleanup results
 */
export async function cleanupUserProfilePhotos(userId: string) {
  try {
    console.log(`[STORAGE-CLEANUP] Starting cleanup for user: ${userId}`);
    
    // Call the Edge Function using Supabase client
    const { data, error } = await supabase.functions.invoke('storage-cleanup', {
      body: { user_id: userId }
    });
    
    if (error) {
      console.error('[STORAGE-CLEANUP] Function error:', error);
      throw error;
    }
    
    console.log(`[STORAGE-CLEANUP] Successfully deleted ${data.deleted} files`);
    return data;
    
  } catch (error) {
    console.error('[STORAGE-CLEANUP] Failed to cleanup storage:', error);
    throw error;
  }
}

/**
 * Example: Full user account deletion flow with storage cleanup
 */
export async function deleteUserAccount(userId: string) {
  try {
    // Step 1: Clean up profile photos
    const cleanupResult = await cleanupUserProfilePhotos(userId);
    console.log(`Cleaned up ${cleanupResult.deleted} profile photos`);
    
    // Step 2: Delete user profile from database
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', userId);
      
    if (profileError) throw profileError;
    
    // Step 3: Delete auth user (requires service role or admin API)
    // This would typically be done server-side with proper permissions
    console.log('Profile deleted successfully');
    
    return { success: true, photosDeleted: cleanupResult.deleted };
    
  } catch (error) {
    console.error('Failed to delete user account:', error);
    throw error;
  }
}

/**
 * Alternative: Direct HTTP call to the function (if not using Supabase client)
 */
export async function cleanupUserPhotosDirectCall(userId: string, functionUrl: string) {
  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ user_id: userId })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('Direct cleanup call failed:', error);
    throw error;
  }
}