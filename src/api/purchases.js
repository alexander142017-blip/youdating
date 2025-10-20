import { supabase } from './supabase';

/**
 * Create a purchase record
 * @param {Object} params - Purchase parameters
 * @param {string} params.userId - User ID making the purchase
 * @param {string} params.productId - Product/item ID being purchased
 * @param {Object} params.metadata - Additional metadata about the purchase
 * @returns {Promise<Object>} Created purchase record
 */
export async function createPurchase({ userId, productId, metadata = {} }) {
  const purchaseData = {
    user_id: userId,
    product_id: productId,
    metadata,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('purchases')
    .insert(purchaseData)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
