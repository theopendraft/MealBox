import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Build optimization
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          charts: ['recharts'],
          icons: ['@heroicons/react'],
          router: ['react-router-dom']
        }
      }
    },
    // Optimize for production
    minify: 'esbuild',
  },
  
  // Preview settings
  preview: {
    port: 3000,
    host: true
  },
  
  // Dev server settings
  server: {
    port: 3000,
    host: true
  }
})
