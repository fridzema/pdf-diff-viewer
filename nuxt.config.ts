// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: process.env.NODE_ENV === 'development' },
  ssr: false, // Disable SSR for static hosting (DigitalOcean, Netlify, etc.)
  modules: ['@nuxtjs/tailwindcss'],
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
      include: ['pdfjs-dist'],
    },
  },
})
