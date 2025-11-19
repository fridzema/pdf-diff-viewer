// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: process.env.NODE_ENV === 'development' },
  ssr: false, // Disable SSR for static hosting (DigitalOcean, Netlify, etc.)
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt', // State management
  ],
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
