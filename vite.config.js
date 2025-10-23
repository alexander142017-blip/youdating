import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';

export default defineConfig({
  plugins: [
    react(), 
    visualizer({ filename: "stats.html", open: false })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  build: {
    sourcemap: false,
    target: "es2019",
    chunkSizeWarningLimit: 900, // TODO: Reduce to 500KB once remaining optimizations are complete
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react")) return "vendor-react";
            if (id.includes("@supabase")) return "vendor-supabase";
            if (id.includes("libphonenumber-js")) return "vendor-phone";
            if (id.includes("@tanstack") || id.includes("react-query")) return "vendor-query";
            if (id.includes("lucide-react")) return "vendor-icons";
            if (id.includes("date-fns")) return "vendor-dates";
            return "vendor";
          }
        },
      },
    },
  },
});