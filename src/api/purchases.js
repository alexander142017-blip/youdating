import { supabase } from './supabase.js';

/**
 * Create a purchase record
 * @param {Object} purchaseData - Purchase data
 * @param {string} purchaseData.userId - User ID
 * @param {string} purchaseData.productId - Product ID
 * @param {number} [purchaseData.amount] - Purchase amount
 * @param {string} [purchaseData.currency] - Currency code
 * @returns {Promise<Object>} Created purchase object
 */
export async function createPurchase({ userId, productId, amount, currency = 'USD' }) {
  try {
    const { data: purchase, error } = await supabase
      .from('purchases')
      .insert({
        user_id: userId,
        product_id: productId,
        amount,
        currency,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return purchase;
  } catch (err) {
    console.error('Error in createPurchase:', err);
    throw err;
  }
}
