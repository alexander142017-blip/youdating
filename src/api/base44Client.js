import { createClient } from '@base44/sdk';

const isDev = import.meta.env.DEV;

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
  : createClient({
      appId: "68f52ba679ecae0017fef47e",
      requiresAuth: true,
    });
