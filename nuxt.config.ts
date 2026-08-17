import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()]
  },
  app: {
    head: {
      title: 'Shelf — Book Discovery',
      meta: [
        { name: 'description', content: 'Search, explore, and shortlist books powered by the Open Library API.' }
      ]
    }
  }
})
