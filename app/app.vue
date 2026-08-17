<script setup lang="ts">
const shortlistOpen = ref(false)
const { items } = useShortlist()
</script>

<template>
  <div class="min-h-screen bg-surface-50">
    <NuxtRouteAnnouncer />
    <header class="sticky top-0 z-30 border-b border-surface-200 bg-surface-0/85 backdrop-blur">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        <NuxtLink to="/" class="flex items-center gap-2 text-lg font-bold tracking-tight text-surface-900 transition-opacity hover:opacity-80">
          <span
            class="flex h-8 w-8 items-center justify-center rounded-control bg-brand-600 text-white shadow-sm"
            aria-hidden="true"
          >
            <Icon name="lucide:library-big" class="h-4.5 w-4.5" />
          </span>
          Shelf
        </NuxtLink>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-control border border-surface-300 bg-surface-0 px-3.5 py-2 text-sm font-medium text-surface-800 shadow-sm transition-all hover:border-brand-400 hover:text-brand-700 active:scale-[0.97]"
          @click="shortlistOpen = true"
        >
          <Icon name="lucide:star" class="h-4 w-4" />
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
