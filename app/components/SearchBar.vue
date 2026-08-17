<script setup lang="ts">
const modelValue = defineModel<string>({ default: '' })

defineProps<{ loading?: boolean }>()
defineEmits<{ search: [] }>()
</script>

<template>
  <form class="flex gap-2" role="search" @submit.prevent="$emit('search')">
    <label for="book-search" class="sr-only">Search for a book title or author</label>
    <div class="relative flex-1">
      <svg
        class="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-surface-600"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        aria-hidden="true"
      >
        <circle cx="9" cy="9" r="6" />
        <path stroke-linecap="round" d="M17 17l-3.5-3.5" />
      </svg>
      <input
        id="book-search"
        v-model="modelValue"
        type="search"
        placeholder="Search by title or author…"
        class="w-full rounded-control border border-surface-300 bg-surface-0 py-2.5 pl-10 pr-9 text-sm text-surface-900 shadow-sm transition-colors placeholder:text-surface-600 focus-visible:border-brand-600"
      >
      <button
        v-if="modelValue"
        type="button"
        class="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-surface-600 hover:bg-surface-100 hover:text-surface-900"
        aria-label="Clear search"
        @click="modelValue = ''"
      >
        <svg viewBox="0 0 20 20" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" d="M5 5l10 10M15 5L5 15" />
        </svg>
      </button>
    </div>
    <button
      type="submit"
      class="shrink-0 rounded-control bg-brand-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      :disabled="loading"
    >
      {{ loading ? 'Searching…' : 'Search' }}
    </button>
  </form>
</template>
