import { createClient } from '@base44/sdk';

const isDev = import.meta.env.DEV;

// Mock Base44 client locally or on external hosts
export const base44 = isDev
  ? {
      auth: {
        me: async () => ({
          id: 1,
          name: "Local Test User",
          email: "test@youdating.app",
          isPremium: false,
          premiumPlan: null,
          premiumExpiresAt: null,
        }),
        updateMe: async (data) => ({ ...data }),
        logout: async () => console.log("Mock logout (dev mode)"),
      },
      entities: {
        AnalyticsEvents: { create: async () => null },
        Config: { list: async () => [] },
        Purchase: { create: async () => null },
      },
    }
  : {
      auth: {
        me: async () => ({
          id: 1,
          name: "Production Test User",
          email: "prod@youdating.app",
          isPremium: false,
          premiumPlan: null,
        }),
        updateMe: async (data) => ({ ...data }),
        logout: async () => console.log("Mock logout (production mode)"),
      },
      entities: {
        AnalyticsEvents: { create: async () => null },
        Config: { list: async () => [] },
        Purchase: { create: async () => null },
      },
    };
