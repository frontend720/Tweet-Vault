import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-maskable.svg'],
      manifest: {
        name: 'Tweet Vault',
        short_name: 'TweetVault',
        description: 'Save and revisit videos and photos from X (Twitter)',
        theme_color: '#111012',
        background_color: '#111012',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/icon-maskable.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Cache Google Fonts, FontAwesome, and app shell
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/kit\.fontawesome\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fontawesome',
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  build: {
    sourcemap: true,
  },
  base: '/',
  server: {
    allowedHosts: ['jahs-macbook-air.tail8168ce.ts.net', '100.101.160.68'],
    proxy: {
      '/api': 'http://apple-server.tail8168ce.ts.net:4500',
      '/socket.io': { target: 'http://apple-server.tail8168ce.ts.net:4500', ws: true },
      '/proxy': 'http://apple-server.tail8168ce.ts.net:4500',
    },
  },
})
