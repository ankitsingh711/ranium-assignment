<script setup lang="ts">
defineProps<{ open: boolean }>()
defineEmits<{ close: [] }>()

const { items, remove } = useShortlist()
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex justify-end">
      <div class="absolute inset-0 bg-surface-900/40" @click="$emit('close')" />
      <aside
        class="relative flex h-full w-full max-w-sm flex-col bg-surface-0 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Your shortlist"
      >
        <header class="flex items-center justify-between border-b border-surface-200 px-4 py-3">
          <h2 class="text-base font-semibold text-surface-900">Your shortlist ({{ items.length }})</h2>
          <button
            type="button"
            class="rounded-control px-2 py-1 text-sm text-surface-600 hover:bg-surface-100"
            @click="$emit('close')"
          >
            Close
          </button>
        </header>

        <div class="flex-1 overflow-y-auto p-4">
          <EmptyState
            v-if="items.length === 0"
            title="Your shortlist is empty"
            message="Search for books and tap “Add to shortlist” to save them here."
          />
          <ul v-else class="flex flex-col gap-3">
            <li v-for="item in items" :key="item.id" class="flex gap-3 rounded-card border border-surface-200 p-2">
              <NuxtLink :to="`/books/${item.id}`" class="shrink-0" @click="$emit('close')">
                <img
                  v-if="item.coverUrl"
                  :src="item.coverUrl"
                  :alt="`Cover of ${item.title}`"
                  loading="lazy"
                  class="h-20 w-14 rounded-control object-cover"
                >
                <div v-else class="flex h-20 w-14 items-center justify-center rounded-control bg-surface-100 text-[10px] text-surface-600" aria-hidden="true">
                  No cover
                </div>
              </NuxtLink>
              <div class="flex min-w-0 flex-1 flex-col gap-1">
                <NuxtLink :to="`/books/${item.id}`" class="line-clamp-2 text-sm font-medium text-surface-900 hover:text-brand-700" @click="$emit('close')">
                  {{ item.title }}
                </NuxtLink>
                <p class="line-clamp-1 text-xs text-surface-600">{{ item.author ?? 'Unknown author' }}</p>
                <button
                  type="button"
                  class="mt-auto self-start text-xs font-medium text-danger-600 hover:text-danger-500"
                  @click="remove(item.id)"
                >
                  Remove
                </button>
              </div>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  </Teleport>
</template>
