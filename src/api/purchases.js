import { supabase } from './supabase';

/**
 * Create a purchase record
 * @param {Object} purchaseData - Purchase data
 * @returns {Promise<Object>} Created purchase object
 */
export async function createPurchase(purchaseData) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
      .from('purchases')
      .insert({
        user_id: session.user.id,
        ...purchaseData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating purchase:', error);
    throw error;
  }
}

/**
 * Get purchases for the current user
 * @returns {Promise<Array>} Array of purchase objects
 */
export async function getUserPurchases() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching purchases:', error);
    throw error;
  }
}
