import { supabase } from './supabase';
import { getCurrentUser, updateMe, logout } from './auth';
import { createPurchase } from './purchases';

// Mock/stub implementations for Base44 entities to maintain compatibility
// These should be replaced with actual Supabase implementations as needed

const createMockEntity = (tableName) => ({
  async list() {
    const { data, error } = await supabase
      .from(tableName)
      .select('*');
    if (error) throw error;
    return data || [];
  },
  
  async filter(filters = {}) {
    let query = supabase.from(tableName).select('*');
    
    // Simple filter implementation
    Object.entries(filters).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        // Handle complex filters like { $gte: ... }
        Object.entries(value).forEach(([op, val]) => {
          if (op === '$gte') query = query.gte(key, val);
          else if (op === '$lte') query = query.lte(key, val);
          else if (op === '$gt') query = query.gt(key, val);
          else if (op === '$lt') query = query.lt(key, val);
        });
      } else {
        query = query.eq(key, value);
      }
    });
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
  
  async create(data) {
    const { data: created, error } = await supabase
      .from(tableName)
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return created;
  },
  
  async update(id, data) {
    const { data: updated, error } = await supabase
      .from(tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return updated;
  },
  
  async delete(id) {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  }
});

// Export a base44-compatible object structure
export const base44 = {
  auth: {
    me: getCurrentUser,
    updateMe: updateMe,
    logout: logout
  },
  entities: {
    AnalyticsEvents: createMockEntity('analytics_events'),
    Config: createMockEntity('config'),
    Purchase: {
      create: async (data) => {
        const { data: { user } } = await supabase.auth.getUser();
        return createPurchase({
          userId: user?.id,
          productId: data.product_id || data.productId,
          metadata: data
        });
      }
    },
    User: createMockEntity('profiles'), // Map User to profiles table
    Like: createMockEntity('likes'),
    Match: createMockEntity('matches'),
    Message: createMockEntity('messages'),
    Block: createMockEntity('blocks'),
    Report: createMockEntity('reports')
  },
  integrations: {
    Core: {
      async UploadFile({ file }) {
        // Upload file to Supabase storage
        const fileName = `${Date.now()}_${file.name}`;
        const { error } = await supabase.storage
          .from('uploads')
          .upload(fileName, file);
        
        if (error) throw error;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('uploads')
          .getPublicUrl(fileName);
        
        return { file_url: publicUrl };
      },
      
      async SendEmail(emailData) {
        // Mock implementation - in production, this would call an edge function
        console.log('SendEmail called (mock):', emailData);
        return { success: true, message: 'Email queued' };
      }
    }
  }
};
