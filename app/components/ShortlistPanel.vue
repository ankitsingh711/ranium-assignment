<script setup lang="ts">
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { items, remove } = useShortlist()
const closeButton = useTemplateRef<HTMLButtonElement>('closeButton')

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

watch(
  () => props.open,
  async (isOpen) => {
    if (!import.meta.client) return
    if (isOpen) {
      window.addEventListener('keydown', onKeydown)
      await nextTick()
      closeButton.value?.focus()
    } else {
      window.removeEventListener('keydown', onKeydown)
    }
  }
)

onUnmounted(() => {
  if (import.meta.client) window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex justify-end">
      <Transition
        appear
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-150"
        leave-to-class="opacity-0"
      >
        <div class="absolute inset-0 bg-surface-900/40" @click="$emit('close')" />
      </Transition>

      <Transition
        appear
        enter-active-class="transition-transform duration-250 ease-out"
        enter-from-class="translate-x-full"
        leave-active-class="transition-transform duration-200 ease-in"
        leave-to-class="translate-x-full"
      >
        <aside
          class="relative flex h-full w-full max-w-sm flex-col bg-surface-0 shadow-xl"
          role="dialog"
          aria-modal="true"
          aria-label="Your shortlist"
        >
          <header class="flex items-center justify-between border-b border-surface-200 px-4 py-3.5">
            <h2 class="text-base font-semibold text-surface-900">Your shortlist ({{ items.length }})</h2>
            <button
              ref="closeButton"
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-control text-surface-600 hover:bg-surface-100 hover:text-surface-900"
              aria-label="Close shortlist"
              @click="$emit('close')"
            >
              <Icon name="lucide:x" class="h-4 w-4" />
            </button>
          </header>

          <div class="flex-1 overflow-y-auto p-4">
            <EmptyState
              v-if="items.length === 0"
              icon="lucide:star"
              title="Your shortlist is empty"
              message="Search for books and tap the star to save them here."
            />
            <ul v-else class="flex flex-col gap-3">
              <li
                v-for="item in items"
                :key="item.id"
                class="flex gap-3 rounded-card border border-surface-200 p-2 transition-colors hover:border-surface-300"
              >
                <NuxtLink :to="`/books/${item.id}`" class="shrink-0" @click="$emit('close')">
                  <img
                    v-if="item.coverUrl"
                    :src="item.coverUrl"
                    :alt="`Cover of ${item.title}`"
                    loading="lazy"
                    class="h-20 w-14 rounded-control object-cover"
                  >
                  <div v-else class="flex h-20 w-14 items-center justify-center rounded-control bg-surface-100 text-surface-300" aria-hidden="true">
                    <Icon name="lucide:book-x" class="h-5 w-5" />
                  </div>
                </NuxtLink>
                <div class="flex min-w-0 flex-1 flex-col gap-1">
                  <NuxtLink :to="`/books/${item.id}`" class="line-clamp-2 text-sm font-medium text-surface-900 hover:text-brand-700" @click="$emit('close')">
                    {{ item.title }}
                  </NuxtLink>
                  <p class="line-clamp-1 text-xs text-surface-600">{{ item.author ?? 'Unknown author' }}</p>
                  <button
                    type="button"
                    class="mt-auto inline-flex w-fit items-center gap-1 self-start text-xs font-medium text-danger-600 transition-colors hover:text-danger-500"
                    @click="remove(item.id)"
                  >
                    <Icon name="lucide:trash-2" class="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </aside>
      </Transition>
    </div>
  </Teleport>
</template>
