import { getCurrentUser, updateMe, logout } from './auth.js';
import { supabase } from './supabase.js';

// Mock entity operations that use Supabase
const createEntity = (tableName) => ({
  list: async (orderBy) => {
    try {
      let query = supabase.from(tableName).select('*');
      if (orderBy) {
        const isDesc = orderBy.startsWith('-');
        const field = isDesc ? orderBy.slice(1) : orderBy;
        query = query.order(field, { ascending: !isDesc });
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error(`Error listing ${tableName}:`, err);
      return [];
    }
  },
  
  filter: async (filters) => {
    try {
      let query = supabase.from(tableName).select('*');
      
      // Apply filters
      for (const [key, value] of Object.entries(filters)) {
        if (typeof value === 'object' && value !== null) {
          // Handle comparison operators like $gte
          for (const [op, val] of Object.entries(value)) {
            if (op === '$gte') {
              query = query.gte(key, val);
            } else if (op === '$lte') {
              query = query.lte(key, val);
            } else if (op === '$gt') {
              query = query.gt(key, val);
            } else if (op === '$lt') {
              query = query.lt(key, val);
            } else if (op === '$eq') {
              query = query.eq(key, val);
            } else if (op === '$ne') {
              query = query.neq(key, val);
            }
          }
        } else {
          query = query.eq(key, value);
        }
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error(`Error filtering ${tableName}:`, err);
      return [];
    }
  },
  
  create: async (data) => {
    try {
      const { data: result, error } = await supabase
        .from(tableName)
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    } catch (err) {
      console.error(`Error creating ${tableName}:`, err);
      throw err;
    }
  },
  
  update: async (id, data) => {
    try {
      const { data: result, error } = await supabase
        .from(tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    } catch (err) {
      console.error(`Error updating ${tableName}:`, err);
      throw err;
    }
  },
  
  delete: async (id) => {
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error(`Error deleting ${tableName}:`, err);
      throw err;
    }
  },
});

// Export the base44 client with Supabase-backed entities
export const base44 = {
  auth: {
    me: getCurrentUser,
    updateMe: updateMe,
    logout: logout,
  },
  entities: {
    User: createEntity('profiles'),
    Like: createEntity('likes'),
    Match: createEntity('matches'),
    Block: createEntity('blocks'),
    Report: createEntity('reports'),
    Message: createEntity('messages'),
    AnalyticsEvents: createEntity('analytics_events'),
    Config: createEntity('config'),
    Purchase: createEntity('purchases'),
  },
};
