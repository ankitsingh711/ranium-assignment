import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/icon'],
  css: ['~/assets/css/main.css'],
  icon: {
    mode: 'svg',
    class: 'icon',
    provider: 'none'
  },
  vite: {
    plugins: [tailwindcss()]
  },
  app: {
    head: {
      title: 'Shelf — Book Discovery',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Search, explore, and shortlist books powered by the Open Library API.' }
      ]
    }
  }
})
