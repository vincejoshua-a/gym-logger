import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // GitHub Pages serves a project site under /<repo>/. Use that base for the
  // production build, but keep the dev server at root for easy local testing.
  // vite-plugin-pwa derives the manifest scope/start_url and SW scope from this.
  base: command === 'build' ? '/gym-logger/' : '/',
  plugins: [
    react(),
    VitePWA({
      // Auto-apply updates: when you reopen the app it silently pulls the
      // latest build. The UpdatePrompt component still surfaces a toast so you
      // get visible confirmation (offline-ready / updated).
      registerType: 'autoUpdate',
      // Non-glob static files to also precache (so they're available offline).
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Gym Logger',
        short_name: 'Gym Log',
        description: 'Log your actual weights and reps against your program.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        // start_url and scope are intentionally omitted — vite-plugin-pwa fills
        // them from the Vite `base` above, so they stay correct under /gym-logger/.
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache the whole app shell so it opens with zero connection.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
      // Enable the service worker in dev so it can be tested before deploying.
      devOptions: {
        enabled: true,
      },
    }),
  ],
}))
