import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import process from 'node:process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const baseAliases = {
  '@app': path.resolve(__dirname, 'src/app'),
  '@entities': path.resolve(__dirname, 'src/entities'),
  '@features': path.resolve(__dirname, 'src/features'),
  '@shared': path.resolve(__dirname, 'src/shared'),
  '@widgets': path.resolve(__dirname, 'src/widgets'),
  '@pages': path.resolve(__dirname, 'src/pages'),
}

// https://vite.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: ['prop-types', 'topojson-client'],
  },
  plugins: [
    react(),
    // Excluir VitePWA en tests para evitar errores de módulos virtuales
    !process.env.VITEST && VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      cleanupOutdatedCaches: true,
      manifest: {
        id: '/',
        name: 'Keeptrip — Registra tus aventuras',
        short_name: 'Keeptrip',
        description: 'Registra, revive y comparte tus aventuras de viaje.',
        lang: 'es',
        theme_color: '#FF6B35',
        background_color: '#F8FAFC',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        categories: ['travel', 'lifestyle'],
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB — vendor-map (mapbox-gl ~2.5MB raw) necesita margen
        // Permite que el SW responda a nav requests → requerido para el install prompt en Chrome
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/\/__\/auth/],
        runtimeCaching: [
          {
            // Mapbox tiles
            urlPattern: /^https:\/\/api\.mapbox\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mapbox-tiles',
              expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Mapbox static assets
            urlPattern: /^https:\/\/[a-z]+\.tiles\.mapbox\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mapbox-static',
              expiration: { maxEntries: 500, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Firebase Storage images (gallery + covers)
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'firebase-images',
              expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Flag CDN
            urlPattern: /^https:\/\/flagcdn\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'flag-icons',
              expiration: { maxEntries: 250, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Google Fonts
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    modulePreload: false,
    // Mapbox GL es pesado por naturaleza y se entrega en chunk lazy dedicado.
    // Subimos el umbral para evitar warning de tamaño no accionable en CI.
    chunkSizeWarningLimit: 1800,
    // Strip noisy console.* calls from production bundles, but retain errors/warnings.
    esbuild: {
      pure: ['console.log', 'console.info', 'console.debug'],
    },
    rollupOptions: {
      output: {
        /**
         * Divide las dependencias de terceros en chunks cacheables independientemente.
         * Nota: no forzamos chunk manual para Mapbox porque en rolldown-vite puede
         * terminar como dependencia base del entry. Dejamos que el bundler lo mantenga
         * ligado a las rutas lazy de mapa/visor.
         * vendor-firebase y vendor-motion se separan para que un cambio en el código de la
         * app no invalide la caché de estas librerías estables.
         */
        manualChunks(id) {
          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/react-router') ||
            id.includes('/node_modules/scheduler/')
          ) {
            return 'vendor-react';
          }
          if (id.includes('/node_modules/firebase')) {
            return 'vendor-firebase';
          }
          if (id.includes('/node_modules/framer-motion')) {
            return 'vendor-motion';
          }
        },
      },
    },
  },
  resolve: {
    alias: process.env.VITEST
      ? {
          ...baseAliases,
          // En tests, redirigir módulos pesados a stubs livianos para evitar OOM.
          // lucide-react barrel (~2000 iconos) y framer-motion no se tree-shakean
          // en el entorno de Vitest/rolldown-vite.
          'lucide-react': path.resolve(__dirname, '__mocks__/lucide-react.js'),
          'framer-motion': path.resolve(__dirname, '__mocks__/framer-motion.js'),
          // Mock virtual PWA module to avoid virtual module resolution errors in tests
          'virtual:pwa-register/react': path.resolve(__dirname, '__mocks__/pwa-register-react.js'),
        }
      : baseAliases,
  },
  test: {
    // Setup global
    setupFiles: ['./vitest.setup.js'],
    // Excluir E2E del runner de Vitest
    exclude: ['e2e/**', 'node_modules/**'],
  },
})
