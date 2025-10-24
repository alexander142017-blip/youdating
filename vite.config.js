import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';

export default defineConfig({
  base: '/',
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
    rollupOptions: {
      output: {
        manualChunks: undefined, // disable aggressive vendor chunk splitting
      },
    },
    minify: 'esbuild',
    target: 'esnext',
  },
});