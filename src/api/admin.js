import { supabase } from './supabase';

/**
 * List all reports
 * Replaces: base44.entities.Report.list()
 */
export async function listReports(orderBy = '-created_at') {
  try {
    let query = supabase.from('reports').select('*');
    
    // Parse orderBy parameter (e.g., '-created_date' means descending)
    const ascending = !orderBy.startsWith('-');
    const field = orderBy.replace(/^-/, '');
    
    query = query.order(field, { ascending });

    const { data, error } = await query;

    if (error) {
      console.error('Error listing reports:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in listReports:', error);
    return [];
  }
}

/**
 * Update a user (admin function)
 * Replaces: base44.entities.User.update()
 */
export async function updateUser(userId, userData) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...userData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateUser:', error);
    throw error;
  }
}

/**
 * Delete a user (admin function)
 * Replaces: base44.entities.User.delete()
 */
export async function deleteUser(userId) {
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting user:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteUser:', error);
    throw error;
  }
}
