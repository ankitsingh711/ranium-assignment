<script setup lang="ts">
const modelValue = defineModel<string>({ default: '' })

defineProps<{ loading?: boolean }>()
defineEmits<{ search: [] }>()
</script>

<template>
  <form class="flex gap-2" role="search" @submit.prevent="$emit('search')">
    <label for="book-search" class="sr-only">Search for a book title or author</label>
    <input
      id="book-search"
      v-model="modelValue"
      type="search"
      placeholder="Search by title or author…"
      class="w-full rounded-control border border-surface-300 bg-surface-0 px-4 py-2.5 text-sm text-surface-900 placeholder:text-surface-600 focus-visible:border-brand-600"
    >
    <button
      type="submit"
      class="shrink-0 rounded-control bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      :disabled="loading"
    >
      {{ loading ? 'Searching…' : 'Search' }}
    </button>
  </form>
</template>
