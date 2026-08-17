<script setup lang="ts">
import type { BookSummary } from '~/types/book'

defineProps<{
  book: BookSummary
  shortlisted: boolean
}>()

defineEmits<{ toggleShortlist: [] }>()
</script>

<template>
  <div class="group relative flex flex-col overflow-hidden rounded-card border border-surface-200 bg-surface-0 transition-all duration-200 hover:-translate-y-0.5 hover:border-surface-300 hover:shadow-lg">
    <NuxtLink :to="`/books/${book.id}`" class="flex flex-1 flex-col focus-visible:outline-2 focus-visible:outline-offset-[-2px]">
      <div class="relative aspect-[2/3] overflow-hidden bg-surface-100">
        <img
          v-if="book.coverUrl"
          :src="book.coverUrl"
          :alt="`Cover of ${book.title}`"
          loading="lazy"
          class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        >
        <div v-else class="flex h-full w-full flex-col items-center justify-center gap-1.5 px-4 text-center">
          <Icon name="lucide:book-x" class="h-6 w-6 text-surface-300" />
          <span class="text-xs text-surface-600">No cover available</span>
        </div>

        <div class="absolute right-2 top-2">
          <ShortlistButton variant="icon" :active="shortlisted" @toggle="$emit('toggleShortlist')" />
        </div>

        <span
          v-if="book.source === 'archive'"
          class="absolute left-2 top-2 rounded-full bg-surface-900/75 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur"
        >
          Internet Archive
        </span>
      </div>
      <div class="flex flex-1 flex-col gap-0.5 p-3">
        <h3 class="line-clamp-2 text-sm font-semibold leading-snug text-surface-900 group-hover:text-brand-700">
          {{ book.title }}
        </h3>
        <p class="line-clamp-1 text-sm text-surface-600">{{ book.author ?? 'Unknown author' }}</p>
        <p class="mt-auto pt-2 text-xs font-medium text-surface-600">{{ book.firstPublishYear ?? 'Year unknown' }}</p>
      </div>
    </NuxtLink>
  </div>
</template>
