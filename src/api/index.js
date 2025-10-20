import { supabase } from './supabase';
import { auth } from './auth';

/**
 * Generic CRUD operations for Supabase tables
 */
const createEntityHelper = (tableName) => ({
  async list(filters = {}) {
    let query = supabase.from(tableName).select('*');
    
    // Apply filters if provided
    Object.entries(filters).forEach(([key, value]) => {
      if (key !== '$or') {
        query = query.eq(key, value);
      }
    });
    
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  },

  // Alias for list() for backward compatibility
  async filter(filters = {}) {
    // Handle $or specially for complex queries
    if (filters.$or) {
      // For $or queries, we need to fetch all and filter in memory
      const { data, error } = await supabase.from(tableName).select('*');
      if (error) throw new Error(error.message);
      
      // Apply non-$or filters
      let filtered = data || [];
      Object.entries(filters).forEach(([key, value]) => {
        if (key !== '$or') {
          filtered = filtered.filter(item => item[key] === value);
        }
      });
      
      // Apply $or filter
      if (filters.$or && filters.$or.length > 0) {
        filtered = filtered.filter(item => {
          return filters.$or.some(condition => {
            return Object.entries(condition).every(([k, v]) => item[k] === v);
          });
        });
      }
      
      return filtered;
    }
    
    // Otherwise just use list
    return this.list(filters);
  },

  async get(id) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },

  async create(record) {
    const { data, error } = await supabase
      .from(tableName)
      .insert(record)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from(tableName)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(error.message);
    return { success: true };
  },
});

/**
 * User entity with custom methods
 */
const User = {
  async list(filters = {}) {
    let query = supabase.from('profiles').select('*');
    
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  },

  async get(id) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(error.message);
    return { success: true };
  },
};

/**
 * File upload helper using Supabase storage
 */
const UploadFile = async ({ file }) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  const { error } = await supabase.storage
    .from('public-files')
    .upload(filePath, file);

  if (error) {
    throw new Error(error.message);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('public-files')
    .getPublicUrl(filePath);

  return { file_url: publicUrl };
};

/**
 * Core integrations object
 */
const Core = {
  UploadFile,
  
  // Placeholder implementations for other integrations
  async CreateFileSignedUrl({ path }) {
    const { data, error } = await supabase.storage
      .from('private-files')
      .createSignedUrl(path, 3600); // 1 hour expiry
    
    if (error) throw new Error(error.message);
    return data;
  },

  async UploadPrivateFile({ file }) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `private/${fileName}`;

    const { error } = await supabase.storage
      .from('private-files')
      .upload(filePath, file);

    if (error) throw new Error(error.message);
    return { file_path: filePath };
  },

  // These would need external service integrations or Edge Functions
  async InvokeLLM() {
    console.warn('InvokeLLM not implemented - requires external integration');
    return null;
  },

  async SendEmail() {
    console.warn('SendEmail not implemented - requires external integration');
    return null;
  },

  async GenerateImage() {
    console.warn('GenerateImage not implemented - requires external integration');
    return null;
  },

  async ExtractDataFromUploadedFile() {
    console.warn('ExtractDataFromUploadedFile not implemented - requires external integration');
    return null;
  },
};

/**
 * Export entities similar to base44 SDK structure
 */
export const entities = {
  Match: createEntityHelper('matches'),
  Message: createEntityHelper('messages'),
  Block: createEntityHelper('blocks'),
  Report: createEntityHelper('reports'),
  Like: createEntityHelper('likes'),
  ActionLog: createEntityHelper('action_logs'),
  AnalyticsEvents: createEntityHelper('analytics_events'),
  Purchase: createEntityHelper('purchases'),
  Config: createEntityHelper('config'),
  User,
};

/**
 * Export integrations
 */
export const integrations = {
  Core,
};

/**
 * Main API object that mimics base44 SDK structure
 */
export const api = {
  auth,
  entities,
  integrations,
};

// For backward compatibility, export as base44
export const base44 = api;
