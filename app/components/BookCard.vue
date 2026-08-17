<script setup lang="ts">
import type { BookSummary } from '~/types/book'

defineProps<{
  book: BookSummary
  shortlisted: boolean
}>()

defineEmits<{ toggleShortlist: [] }>()
</script>

<template>
  <div class="group relative flex flex-col overflow-hidden rounded-card border border-surface-200 bg-surface-0 transition-shadow hover:shadow-md">
    <NuxtLink :to="`/books/${book.id}`" class="flex flex-1 flex-col focus-visible:outline-2 focus-visible:outline-offset-[-2px]">
      <div class="flex aspect-[2/3] items-center justify-center bg-surface-100">
        <img
          v-if="book.coverUrl"
          :src="book.coverUrl"
          :alt="`Cover of ${book.title}`"
          loading="lazy"
          class="h-full w-full object-cover"
        >
        <span v-else class="px-4 text-center text-sm text-surface-600" aria-hidden="true">No cover available</span>
      </div>
      <div class="flex flex-1 flex-col gap-1 p-3">
        <h3 class="line-clamp-2 text-sm font-semibold text-surface-900">{{ book.title }}</h3>
        <p class="line-clamp-1 text-sm text-surface-600">{{ book.author ?? 'Unknown author' }}</p>
        <p class="mt-auto text-xs text-surface-600">{{ book.firstPublishYear ?? 'Year unknown' }}</p>
      </div>
    </NuxtLink>
    <div class="p-3 pt-0">
      <ShortlistButton size="sm" :active="shortlisted" @toggle="$emit('toggleShortlist')" />
    </div>
  </div>
</template>
