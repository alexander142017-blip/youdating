import { supabase } from './supabase';
import { getCurrentUser } from './auth';
import { upsertProfile, markOnboardingComplete } from './profiles';
import { createPurchase } from './purchases';

/**
 * Helper object that provides a compatibility layer for base44 API
 * This allows existing code to continue working with minimal changes
 */
export const base44 = {
  auth: {
    /**
     * Get current authenticated user with profile
     */
    me: async () => {
      return getCurrentUser();
    },

    /**
     * Update current user's profile
     */
    updateMe: async (data) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // If profile_completed is set, mark onboarding complete
      if (data.profile_completed) {
        await markOnboardingComplete(user.id);
      }

      // Update profile with the provided data
      return upsertProfile({ ...data, id: user.id });
    },

    /**
     * Logout current user
     */
    logout: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('User logged out');
    },
  },

  entities: {
    /**
     * Analytics Events - minimal implementation
     */
    AnalyticsEvents: {
      create: async (eventData) => {
        // Log analytics event to Supabase
        try {
          const { error } = await supabase
            .from('analytics_events')
            .insert({
              user_email: eventData.user_email,
              type: eventData.type,
              context: eventData.context || {},
              day: eventData.day,
              created_at: new Date().toISOString(),
            });
          
          if (error) {
            console.warn('Analytics event failed:', error);
          }
        } catch (e) {
          console.warn('Analytics event failed:', e);
        }
        return null;
      },
    },

    /**
     * Config - minimal implementation
     */
    Config: {
      list: async () => {
        try {
          const { data, error } = await supabase
            .from('config')
            .select('*');
          
          if (error) {
            console.warn('Config fetch failed:', error);
            return [];
          }
          
          return data || [];
        } catch (e) {
          console.warn('Config fetch failed:', e);
          return [];
        }
      },
    },

    /**
     * Purchase - minimal implementation
     */
    Purchase: {
      create: async (purchaseData) => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          return createPurchase({
            userId: user?.id || purchaseData.user_id,
            productId: purchaseData.product_id,
            metadata: purchaseData.metadata || {},
          });
        } catch (e) {
          console.warn('Purchase creation failed:', e);
          return null;
        }
      },
    },
  },

  integrations: {
    Core: {
      /**
       * Upload a file to Supabase Storage
       */
      UploadFile: async ({ file }) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const { error } = await supabase.storage
          .from('files')
          .upload(filePath, file);

        if (error) {
          throw error;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('files')
          .getPublicUrl(filePath);

        return { file_url: publicUrl };
      },

      // Stub implementations for other integrations
      InvokeLLM: async () => {
        console.warn('InvokeLLM not implemented in Supabase version');
        return null;
      },

      SendEmail: async () => {
        console.warn('SendEmail not implemented in Supabase version');
        return null;
      },

      GenerateImage: async () => {
        console.warn('GenerateImage not implemented in Supabase version');
        return null;
      },

      ExtractDataFromUploadedFile: async () => {
        console.warn('ExtractDataFromUploadedFile not implemented in Supabase version');
        return null;
      },

      CreateFileSignedUrl: async () => {
        console.warn('CreateFileSignedUrl not implemented in Supabase version');
        return null;
      },

      UploadPrivateFile: async () => {
        console.warn('UploadPrivateFile not implemented in Supabase version');
        return null;
      },
    },
  },
};
