import { supabase } from './supabase';

/**
 * Create a purchase record in the purchases table.
 * Adjust fields to match your DB schema.
 */
export async function createPurchase({ userId, productId, metadata = {} }) {
  const payload = {
    user_id: userId,
    product_id: productId,
    metadata,
    created_at: new Date().toISOString()
  };
  const { data, error } = await supabase.from('purchases').insert([payload]).select().maybeSingle();
  if (error) throw error;
  return data;
}