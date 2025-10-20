import { supabase } from './supabase';

/**
 * List configuration values
 * Replaces: base44.entities.Config.list()
 */
export async function listConfig() {
  try {
    const { data, error } = await supabase
      .from('config')
      .select('*');

    if (error) {
      console.error('Error listing config:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in listConfig:', error);
    return [];
  }
}

/**
 * Get a specific config value by key
 */
export async function getConfigValue(key) {
  try {
    const { data, error } = await supabase
      .from('config')
      .select('*')
      .eq('key', key)
      .single();

    if (error) {
      console.error('Error getting config value:', error);
      return null;
    }

    return data?.value?.val || null;
  } catch (error) {
    console.error('Error in getConfigValue:', error);
    return null;
  }
}
