import { supabase } from './supabase';

/**
 * Create a purchase record
 * Replaces: base44.entities.Purchase.create() or base44.entities.Purchases.create()
 */
export async function createPurchase({ userId, productId, amount, metadata = {} }) {
  try {
    const { data, error } = await supabase
      .from('purchases')
      .insert({
        user_id: userId,
        product_id: productId,
        amount,
        metadata,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating purchase:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createPurchase:', error);
    throw error;
  }
}

/**
 * List purchases for a user
 */
export async function listPurchases(userId) {
  try {
    const { data, error } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error listing purchases:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in listPurchases:', error);
    return [];
  }
}
