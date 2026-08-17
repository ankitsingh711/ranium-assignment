<script setup lang="ts">
const shortlistOpen = ref(false)
const { items } = useShortlist()
</script>

<template>
  <div class="min-h-screen bg-surface-50">
    <NuxtRouteAnnouncer />
    <header class="sticky top-0 z-30 border-b border-surface-200 bg-surface-0/85 backdrop-blur">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        <NuxtLink to="/" class="flex items-center gap-2 text-lg font-bold tracking-tight text-surface-900">
          <span
            class="flex h-8 w-8 items-center justify-center rounded-control bg-brand-600 text-base text-white"
            aria-hidden="true"
          >
            📚
          </span>
          Shelf
        </NuxtLink>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-control border border-surface-300 bg-surface-0 px-3.5 py-2 text-sm font-medium text-surface-800 transition-colors hover:border-brand-400 hover:text-brand-700"
          @click="shortlistOpen = true"
        >
          <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 3.5l1.98 4.26 4.7.55-3.5 3.18.98 4.6L10 13.9l-4.16 2.19.98-4.6-3.5-3.18 4.7-.55L10 3.5z" />
          </svg>
          Shortlist
          <span
            v-if="items.length > 0"
            class="rounded-full bg-brand-600 px-1.5 py-0.5 text-xs font-semibold leading-none text-white"
          >
            {{ items.length }}
          </span>
        </button>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <NuxtPage />
    </main>

    <ShortlistPanel :open="shortlistOpen" @close="shortlistOpen = false" />
  </div>
</template>
