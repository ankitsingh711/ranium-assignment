import { addCollection } from '@iconify/vue'
import { lucideIcons } from '~/utils/icons'

/**
 * Pre-registered subset of the Lucide set, used instead of @nuxt/icon's
 * runtime "server" fetch mode: that mode round-trips through /api/_nuxt_icon
 * on every render, which proved unreliable in dev (relative-URL fetch
 * failures) and adds an avoidable request per icon in production.
 * Registering these ~15 icons directly keeps icon rendering fully
 * synchronous and offline, with no network dependency at all.
 */
export default defineNuxtPlugin(() => {
  addCollection({ prefix: 'lucide', width: 24, height: 24, icons: lucideIcons })
})
