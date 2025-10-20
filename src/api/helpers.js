import { supabase } from './supabase';

// ============================================
// Entity Helper Functions
// ============================================

/**
 * Generic list function for entities
 * @param {string} tableName - Name of the table
 * @param {string} orderBy - Order by column (prefix with '-' for descending)
 * @returns {Promise<Array>} Array of records
 */
async function listEntities(tableName, orderBy = '-created_at') {
  try {
    const isDescending = orderBy.startsWith('-');
    const column = isDescending ? orderBy.slice(1) : orderBy;
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order(column, { ascending: !isDescending });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error listing ${tableName}:`, error);
    throw error;
  }
}

/**
 * Generic filter function for entities
 * @param {string} tableName - Name of the table
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Array>} Array of filtered records
 */
async function filterEntities(tableName, filters = {}) {
  try {
    let query = supabase.from(tableName).select('*');
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error filtering ${tableName}:`, error);
    throw error;
  }
}

/**
 * Generic create function for entities
 * @param {string} tableName - Name of the table
 * @param {Object} data - Data to insert
 * @returns {Promise<Object>} Created record
 */
async function createEntity(tableName, data) {
  try {
    const { data: result, error } = await supabase
      .from(tableName)
      .insert({
        ...data,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  } catch (error) {
    console.error(`Error creating ${tableName}:`, error);
    throw error;
  }
}

/**
 * Generic update function for entities
 * @param {string} tableName - Name of the table
 * @param {string} id - Record ID
 * @param {Object} data - Data to update
 * @returns {Promise<Object>} Updated record
 */
async function updateEntity(tableName, id, data) {
  try {
    const { data: result, error } = await supabase
      .from(tableName)
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  } catch (error) {
    console.error(`Error updating ${tableName}:`, error);
    throw error;
  }
}

/**
 * Generic delete function for entities
 * @param {string} tableName - Name of the table
 * @param {string} id - Record ID
 * @returns {Promise<void>}
 */
async function deleteEntity(tableName, id) {
  try {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error(`Error deleting ${tableName}:`, error);
    throw error;
  }
}

// ============================================
// Specific Entity Exports
// ============================================

// Matches
export const Match = {
  list: () => listEntities('matches'),
  filter: (filters) => filterEntities('matches', filters),
  create: (data) => createEntity('matches', data),
  update: (id, data) => updateEntity('matches', id, data),
  delete: (id) => deleteEntity('matches', id),
};

// Messages
export const Message = {
  list: () => listEntities('messages'),
  filter: (filters) => filterEntities('messages', filters),
  create: (data) => createEntity('messages', data),
  update: (id, data) => updateEntity('messages', id, data),
  delete: (id) => deleteEntity('messages', id),
};

// Blocks
export const Block = {
  list: () => listEntities('blocks'),
  filter: (filters) => filterEntities('blocks', filters),
  create: (data) => createEntity('blocks', data),
  delete: (id) => deleteEntity('blocks', id),
};

// Reports
export const Report = {
  list: (orderBy) => listEntities('reports', orderBy),
  filter: (filters) => filterEntities('reports', filters),
  create: (data) => createEntity('reports', data),
  delete: (id) => deleteEntity('reports', id),
};

// Likes
export const Like = {
  list: () => listEntities('likes'),
  filter: (filters) => filterEntities('likes', filters),
  create: (data) => createEntity('likes', data),
  delete: (id) => deleteEntity('likes', id),
};

// Users (for listing/updating users in admin contexts)
export const User = {
  list: () => listEntities('profiles'),
  update: (id, data) => updateEntity('profiles', id, data),
  delete: (id) => deleteEntity('profiles', id),
};

// Analytics Events (minimal implementation - just create)
export const AnalyticsEvents = {
  create: async (data) => {
    try {
      // Just log for now, or create if table exists
      console.log('Analytics event:', data);
      // Optionally save to a table if it exists
      const { error } = await supabase
        .from('analytics_events')
        .insert({
          ...data,
          created_at: new Date().toISOString(),
        });
      
      // Don't throw on error, analytics shouldn't break the app
      if (error) console.warn('Analytics event error:', error);
      return null;
    } catch (error) {
      console.warn('Analytics event error:', error);
      return null;
    }
  },
  filter: (filters) => filterEntities('analytics_events', filters),
};

// Config
export const Config = {
  list: async () => {
    try {
      const { data, error } = await supabase
        .from('config')
        .select('*');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching config:', error);
      return [];
    }
  },
};

// ============================================
// Integration Helper Functions
// ============================================

/**
 * Upload a file to Supabase Storage
 * @param {File} file - File to upload
 * @param {string} bucket - Storage bucket name (default: 'public')
 * @returns {Promise<Object>} Object with file_url
 */
export async function uploadFile(file, bucket = 'public') {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return { file_url: publicUrl };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

/**
 * Send an email (placeholder - implement with your email service)
 * @param {Object} emailData - Email data
 * @returns {Promise<Object>} Result
 */
export async function sendEmail(emailData) {
  try {
    console.log('Email send requested:', emailData);
    // TODO: Implement with an email service (SendGrid, AWS SES, etc.)
    // For now, just log it
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
