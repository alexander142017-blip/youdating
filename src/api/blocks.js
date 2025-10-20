import { supabase } from './supabase';

/**
 * Create a block
 * Replaces: base44.entities.Block.create()
 */
export async function createBlock(blockData) {
  try {
    const { data, error } = await supabase
      .from('blocks')
      .insert({
        ...blockData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating block:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createBlock:', error);
    throw error;
  }
}

/**
 * List all blocks
 * Replaces: base44.entities.Block.list()
 */
export async function listBlocks(filters = {}) {
  try {
    let query = supabase.from('blocks').select('*');

    if (filters.blocker_email) {
      query = query.eq('blocker_email', filters.blocker_email);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error listing blocks:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in listBlocks:', error);
    return [];
  }
}

/**
 * Delete a block
 * Replaces: base44.entities.Block.delete()
 */
export async function deleteBlock(blockId) {
  try {
    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('id', blockId);

    if (error) {
      console.error('Error deleting block:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteBlock:', error);
    throw error;
  }
}
