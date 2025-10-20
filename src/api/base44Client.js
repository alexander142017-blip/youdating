import { getCurrentUser, updateCurrentUser, logout } from './auth.js';
import { createPurchase } from './purchases.js';
import { supabase } from './supabase.js';

/**
 * Compatibility layer for Base44 SDK
 * This provides the same interface as the old base44 client but uses Supabase/local helpers
 */

// Helper for analytics events (mock implementation for now)
const createAnalyticsEvent = async (eventData) => {
  try {
    const { data, error } = await supabase
      .from('analytics_events')
      .insert({
        user_email: eventData.user_email,
        type: eventData.type,
        context: eventData.context || {},
        day: eventData.day,
        created_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error('Analytics event error:', error);
    }
    return data;
  } catch (error) {
    // Fail silently for analytics
    console.error('Failed to create analytics event:', error);
    return null;
  }
};

// Helper for config (mock implementation for now)
const listConfig = async () => {
  try {
    const { data, error } = await supabase
      .from('config')
      .select('*');
    
    if (error) {
      console.error('Config list error:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Failed to list config:', error);
    return [];
  }
};

// Helper for file upload (mock implementation)
const uploadFile = async ({ file }) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { data, error } = await supabase.storage
      .from('public')
      .upload(filePath, file);

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('public')
      .getPublicUrl(filePath);

    return { file_url: publicUrl };
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};

// Export the base44 compatibility object
export const base44 = {
  auth: {
    me: getCurrentUser,
    updateMe: updateCurrentUser,
    logout: logout,
  },
  entities: {
    AnalyticsEvents: {
      create: createAnalyticsEvent,
    },
    Config: {
      list: listConfig,
    },
    Purchase: {
      create: async (purchaseData) => {
        // Convert from old format (user_email) to new format (userId)
        const user = await getCurrentUser();
        return createPurchase({
          userId: user.id,
          productId: purchaseData.productId,
          platform: purchaseData.platform,
          type: purchaseData.type,
          status: purchaseData.status,
          started_at: purchaseData.startedAt,
          expires_at: purchaseData.expiresAt,
        });
      },
    },
    // Placeholder for other entities that might be used
    Match: { create: async () => null, list: async () => [] },
    Message: { create: async () => null, list: async () => [] },
    Block: { create: async () => null, list: async () => [] },
    Report: { create: async () => null },
    Like: { create: async () => null, list: async () => [] },
    ActionLog: { create: async () => null },
  },
  integrations: {
    Core: {
      UploadFile: uploadFile,
      InvokeLLM: async () => ({ response: 'Mock LLM response' }),
      SendEmail: async () => ({ success: true }),
      GenerateImage: async () => ({ image_url: 'mock-image-url' }),
      ExtractDataFromUploadedFile: async () => ({ data: {} }),
      CreateFileSignedUrl: async () => ({ signed_url: 'mock-signed-url' }),
      UploadPrivateFile: async () => ({ file_url: 'mock-private-file-url' }),
    },
  },
};
