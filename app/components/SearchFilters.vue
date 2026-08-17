<script setup lang="ts">
const sort = defineModel<'relevance' | 'newest' | 'oldest'>('sort', { required: true })
const yearFrom = defineModel<number | null>('yearFrom', { required: true })
const yearTo = defineModel<number | null>('yearTo', { required: true })
const coverOnly = defineModel<boolean>('coverOnly', { required: true })

defineProps<{ active: boolean }>()
defineEmits<{ clear: [] }>()

function onYearFrom(e: Event) {
  const value = (e.target as HTMLInputElement).value
  yearFrom.value = value ? Number(value) : null
}

function onYearTo(e: Event) {
  const value = (e.target as HTMLInputElement).value
  yearTo.value = value ? Number(value) : null
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-3 rounded-card border border-surface-200 bg-surface-0 px-4 py-3">
    <div class="flex items-center gap-2">
      <label for="filter-sort" class="text-xs font-medium text-surface-600">Sort</label>
      <select
        id="filter-sort"
        v-model="sort"
        class="rounded-control border border-surface-300 bg-surface-0 py-1.5 pl-2.5 pr-7 text-sm text-surface-900 focus-visible:border-brand-600"
      >
        <option value="relevance">Relevance</option>
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
      </select>
    </div>

    <div class="flex items-center gap-2">
      <span class="text-xs font-medium text-surface-600">Year</span>
      <input
        type="number"
        inputmode="numeric"
        placeholder="From"
        :value="yearFrom"
        class="w-20 rounded-control border border-surface-300 bg-surface-0 py-1.5 px-2.5 text-sm text-surface-900 placeholder:text-surface-600 focus-visible:border-brand-600"
        @input="onYearFrom"
      >
      <span class="text-surface-600" aria-hidden="true">–</span>
      <input
        type="number"
        inputmode="numeric"
        placeholder="To"
        :value="yearTo"
        class="w-20 rounded-control border border-surface-300 bg-surface-0 py-1.5 px-2.5 text-sm text-surface-900 placeholder:text-surface-600 focus-visible:border-brand-600"
        @input="onYearTo"
      >
    </div>

    <label class="flex items-center gap-2 text-sm text-surface-800">
      <input
        v-model="coverOnly"
        type="checkbox"
        class="h-4 w-4 rounded border-surface-300 text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
      Has cover
    </label>

    <button
      v-if="active"
      type="button"
      class="ml-auto inline-flex items-center gap-1 text-xs font-medium text-surface-600 transition-colors hover:text-brand-700"
      @click="$emit('clear')"
    >
      <Icon name="lucide:x" class="h-3.5 w-3.5" />
      Clear filters
    </button>
  </div>
</template>
