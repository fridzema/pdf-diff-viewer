// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: process.env.NODE_ENV === 'development' },
  ssr: false, // Disable SSR for static hosting (DigitalOcean, Netlify, etc.)
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt', // State management
    '@vite-pwa/nuxt', // PWA support
  ],
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'PDF Diff Viewer',
      short_name: 'PDF Diff',
      description: 'Compare two PDF files visually with advanced diff algorithms',
      theme_color: '#3B82F6',
      background_color: '#ffffff',
      icons: [
        {
          src: '/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
            },
          },
        },
        {
          urlPattern: /\/_nuxt\/.*\.js$/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'js-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
            },
          },
        },
        {
          urlPattern: /\/_nuxt\/.*\.css$/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'css-cache',
            expiration: {
              maxEntries: 20,
              maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
            },
          },
        },
      ],
    },
    devOptions: {
      enabled: false,
      type: 'module',
    },
  },
  hooks: {
    'nitro:build:public-assets': async (nitro) => {
      const fs = await import('fs/promises')
      const path = await import('path')

      const workersSource = path.join(nitro.options.buildDir, 'dist/client/workers')
      const workersTarget = path.join(nitro.options.output.publicDir, 'workers')

      try {
        await fs.mkdir(workersTarget, { recursive: true })
        const files = await fs.readdir(workersSource)
        for (const file of files) {
          await fs.copyFile(path.join(workersSource, file), path.join(workersTarget, file))
        }
        nitro.logger?.info(`✓ Copied ${files.length} worker files to public output`)
      } catch (error) {
        nitro.logger?.warn('Could not copy workers:', error)
      }
    },
  },
  runtimeConfig: {
    public: {
      teamsSupportUser: process.env.NUXT_PUBLIC_TEAMS_SUPPORT_USER || 'fridzema@volkers.nl',
      teamsSupportLink: process.env.NUXT_PUBLIC_TEAMS_SUPPORT_LINK || '',
    },
  },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'PDF Diff Viewer',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Compare two PDF files visually' },
      ],
    },
  },
  vite: {
    optimizeDeps: {
      // PDF.js is now lazy-loaded, but keep for dev optimization
      include: ['pdfjs-dist'],
    },
    worker: {
      format: 'es',
      rollupOptions: {
        output: {
          entryFileNames: 'workers/[name]-[hash].js',
        },
      },
    },
    build: {
      // Optimize chunk splitting for better caching and parallel loading
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks - frequently updated dependencies get their own chunks
            'vendor-vue': ['vue', 'vue-router'],
            'vendor-nuxt': ['#app'],

            // PDF processing - large library, separate chunk
            'pdf-core': ['pdfjs-dist'],

            // Utilities and helpers
            'vendor-utils': ['diff', 'diff2html'],
          },
        },
      },
      // Increase chunk size warning limit (our PDF.js chunk is large but intentional)
      chunkSizeWarningLimit: 1000,
    },
  },
})
