import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  build: {
    target: 'es2020',
    sourcemap: mode !== 'production',
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-rough': ['roughjs'],
          'vendor-zustand': ['zustand'],
          'vendor-lucide': ['lucide-react'],
        },
      },
    },
  },

  optimizeDeps: {
    include: ['react', 'react-dom', 'roughjs', 'zustand'],
  },

  server: {
    host: true,
    port: 5173,
  },

  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
}))
