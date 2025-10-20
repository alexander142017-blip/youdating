import { supabase } from './supabase';

/**
 * Create a match
 * Replaces: base44.entities.Match.create()
 */
export async function createMatch(matchData) {
  try {
    const { data, error } = await supabase
      .from('matches')
      .insert({
        ...matchData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating match:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createMatch:', error);
    throw error;
  }
}

/**
 * Filter matches by criteria
 * Replaces: base44.entities.Match.filter()
 */
export async function filterMatches(filters = {}) {
  try {
    let query = supabase.from('matches').select('*');

    if (filters.user1_email) {
      query = query.eq('user1_email', filters.user1_email);
    }
    if (filters.user2_email) {
      query = query.eq('user2_email', filters.user2_email);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error filtering matches:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in filterMatches:', error);
    return [];
  }
}
