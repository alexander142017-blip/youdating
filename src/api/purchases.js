import { supabase } from './supabase.js';

/**
 * Create a purchase record
 * @param {Object} purchaseData - Purchase data
 * @param {string} purchaseData.userId - The user's ID
 * @param {string} purchaseData.productId - The product ID
 * @param {string} [purchaseData.platform] - Platform (e.g., 'mock', 'stripe')
 * @param {string} [purchaseData.type] - Type (e.g., 'subscription', 'consumable')
 * @param {string} [purchaseData.status] - Status (e.g., 'active', 'cancelled')
 * @returns {Promise<Object>} Created purchase record
 */
export async function createPurchase({ userId, productId, ...additionalData }) {
  const { data, error } = await supabase
    .from('purchases')
    .insert({
      user_id: userId,
      product_id: productId,
      created_at: new Date().toISOString(),
      ...additionalData,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get purchases for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} List of purchases
 */
export async function getUserPurchases(userId) {
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}
