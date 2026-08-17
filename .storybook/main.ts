import type { StorybookConfig } from '@storybook/vue3-vite'
import { fileURLToPath } from 'node:url'

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
  framework: '@storybook/vue3-vite',
  async viteFinal(config) {
    const tailwindcss = (await import('@tailwindcss/vite')).default
    const vue = (await import('@vitejs/plugin-vue')).default
    config.plugins = config.plugins ?? []
    config.plugins.push(vue(), tailwindcss())
    config.resolve = config.resolve ?? {}
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '~': fileURLToPath(new URL('../app', import.meta.url)),
      '@': fileURLToPath(new URL('../app', import.meta.url))
    }
    return config
  }
}
export default config
