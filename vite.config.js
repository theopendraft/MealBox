import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'MealBox',
        short_name: 'MealBox',
        description: 'Home tiffin service management',
        theme_color: '#EF4444',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/MealBox.png', sizes: '192x192', type: 'image/png' },
          { src: '/MealBox.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // Exclude all Firebase/Google API traffic — Firebase SDK manages its own
        // offline persistence; service worker caching these causes Cache.put() errors
        // on streaming WebChannel (Firestore Listen) connections.
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/(firestore|firebase|identitytoolkit|securetoken)\.googleapis\.com/,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
})
