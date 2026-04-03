import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@uaejobs/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2020',
    chunkSizeWarningLimit: 600,
    assetsInlineLimit: 4096,
    minify: 'esbuild',
    cssCodeSplit: true,

    rollupOptions: {
      output: {
        // Split large stable vendors into separately-cacheable chunks.
        // Keep it conservative — only split packages that are:
        //   a) large, b) stable (rarely change), c) have no cross-chunk deps.
        manualChunks(id) {
          // React runtime — tiny, ultra-stable, always cached
          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/scheduler/')
          ) {
            return 'vendor-react';
          }
          // React Query — stable data-fetching layer
          if (id.includes('/node_modules/@tanstack/')) {
            return 'vendor-query';
          }
          // Lucide icons — large tree-shaken icon set
          if (id.includes('/node_modules/lucide-react/')) {
            return 'vendor-icons';
          }
          // HTTP client
          if (id.includes('/node_modules/axios/')) {
            return 'vendor-axios';
          }
          // All other node_modules in one chunk (router, forms, toast, etc.)
          // Keeping router + app together avoids circular-chunk issues with
          // react-router-dom's @remix-run/router internal dependency.
          if (id.includes('/node_modules/')) {
            return 'vendor-misc';
          }
        },
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },

  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query', 'axios'],
  },
});
