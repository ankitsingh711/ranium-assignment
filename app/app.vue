<script setup lang="ts">
const shortlistOpen = ref(false)
const { items } = useShortlist()
</script>

<template>
  <div class="min-h-screen bg-surface-50">
    <NuxtRouteAnnouncer />
    <header class="border-b border-surface-200 bg-surface-0">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <NuxtLink to="/" class="text-lg font-bold tracking-tight text-surface-900">
          Shelf
        </NuxtLink>
        <button
          type="button"
          class="relative rounded-control border border-surface-300 px-3 py-1.5 text-sm font-medium text-surface-800 hover:border-brand-400 hover:text-brand-700"
          @click="shortlistOpen = true"
        >
          Shortlist
          <span
            v-if="items.length > 0"
            class="ml-1 rounded-full bg-brand-600 px-1.5 py-0.5 text-xs font-semibold text-white"
          >
            {{ items.length }}
          </span>
        </button>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-8">
      <NuxtPage />
    </main>

    <ShortlistPanel :open="shortlistOpen" @close="shortlistOpen = false" />
  </div>
</template>
