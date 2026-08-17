import type { Preview } from '@storybook/vue3-vite'
import { setup } from '@storybook/vue3-vite'
import { addCollection, Icon } from '@iconify/vue'
import { lucideIcons } from '../app/utils/icons'
import '../app/assets/css/main.css'

addCollection({ prefix: 'lucide', width: 24, height: 24, icons: lucideIcons })
setup((app) => {
  app.component('Icon', Icon)
})

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
};

export default preview;