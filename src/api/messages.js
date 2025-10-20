import { supabase } from './supabase';

/**
 * Create a message
 * Replaces: base44.entities.Message.create()
 */
export async function createMessage(messageData) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        ...messageData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating message:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createMessage:', error);
    throw error;
  }
}

/**
 * Filter messages by criteria
 * Replaces: base44.entities.Message.filter()
 */
export async function filterMessages(filters = {}) {
  try {
    let query = supabase.from('messages').select('*');

    if (filters.match_id) {
      query = query.eq('match_id', filters.match_id);
    }
    if (filters.$or) {
      // Handle $or queries - this is a simplification
      // For complex queries, you may need to adjust
      console.warn('$or queries not fully supported in filterMessages');
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) {
      console.error('Error filtering messages:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in filterMessages:', error);
    return [];
  }
}

/**
 * Update a match
 * Replaces: base44.entities.Match.update()
 */
export async function updateMatch(matchId, matchData) {
  try {
    const { data, error } = await supabase
      .from('matches')
      .update({
        ...matchData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', matchId)
      .select()
      .single();

    if (error) {
      console.error('Error updating match:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateMatch:', error);
    throw error;
  }
}
