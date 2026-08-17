<script setup lang="ts">
const modelValue = defineModel<string>({ default: '' })

defineProps<{ loading?: boolean }>()
defineEmits<{ search: [] }>()
</script>

<template>
  <form class="flex gap-2" role="search" @submit.prevent="$emit('search')">
    <label for="book-search" class="sr-only">Search for a book title or author</label>
    <div class="relative flex-1">
      <Icon
        name="lucide:search"
        class="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-surface-600"
      />
      <input
        id="book-search"
        v-model="modelValue"
        type="search"
        placeholder="Search by title or author…"
        class="w-full rounded-control border border-surface-300 bg-surface-0 py-2.5 pl-10 pr-9 text-sm text-surface-900 shadow-sm transition-colors placeholder:text-surface-600 focus-visible:border-brand-600 [&::-webkit-search-cancel-button]:hidden"
      >
      <button
        v-if="modelValue"
        type="button"
        class="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-surface-600 transition-colors hover:bg-surface-100 hover:text-surface-900"
        aria-label="Clear search"
        @click="modelValue = ''"
      >
        <Icon name="lucide:x" class="h-3.5 w-3.5" />
      </button>
    </div>
    <button
      type="submit"
      class="inline-flex shrink-0 items-center gap-1.5 rounded-control bg-brand-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
      :disabled="loading"
    >
      <Icon v-if="loading" name="lucide:loader-circle" class="h-4 w-4 animate-spin" />
      {{ loading ? 'Searching…' : 'Search' }}
    </button>
  </form>
</template>
