import { supabase } from './supabase';

/**
 * Create a like
 * Replaces: base44.entities.Like.create()
 */
export async function createLike(likeData) {
  try {
    const { data, error } = await supabase
      .from('likes')
      .insert({
        ...likeData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating like:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createLike:', error);
    throw error;
  }
}

/**
 * Filter likes by criteria
 * Replaces: base44.entities.Like.filter()
 */
export async function filterLikes(filters = {}) {
  try {
    let query = supabase.from('likes').select('*');

    if (filters.from_email) {
      query = query.eq('from_email', filters.from_email);
    }
    if (filters.to_email) {
      query = query.eq('to_email', filters.to_email);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error filtering likes:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in filterLikes:', error);
    return [];
  }
}
