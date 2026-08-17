<script setup lang="ts">
const route = useRoute()
const id = route.params.id as string

const { data: book, pending, error, refresh } = await useAsyncData(
  `book-${id}`,
  () => getBookDetail(id)
)

const { isShortlisted, toggle } = useShortlist()
</script>

<template>
  <div>
    <NuxtLink
      to="/"
      class="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-surface-600 transition-colors hover:text-brand-700"
    >
      <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12.5 4.5L7 10l5.5 5.5" />
      </svg>
      Back to search
    </NuxtLink>

    <BookDetailSkeleton v-if="pending" />

    <ErrorState
      v-else-if="error"
      title="Couldn't load this book"
      message="This book may not exist, or Open Library is temporarily unavailable."
      @retry="refresh"
    />

    <div v-else-if="book" class="flex flex-col gap-8 sm:flex-row sm:gap-10">
      <div class="mx-auto w-48 shrink-0 sm:mx-0 sm:w-56">
        <div class="flex aspect-[2/3] items-center justify-center overflow-hidden rounded-card bg-surface-100 shadow-md">
          <img
            v-if="book.coverUrlLarge"
            :src="book.coverUrlLarge"
            :alt="`Cover of ${book.title}`"
            class="h-full w-full object-cover"
          >
          <div v-else class="flex flex-col items-center gap-2 px-4 text-center" aria-hidden="true">
            <span class="text-3xl">📕</span>
            <span class="text-sm text-surface-600">No cover available</span>
          </div>
        </div>
      </div>

      <div class="flex flex-1 flex-col gap-5">
        <div class="flex flex-col gap-1">
          <h1 class="text-2xl font-bold text-surface-900 sm:text-3xl">{{ book.title }}</h1>
          <p class="text-base text-surface-600">{{ book.author ?? 'Unknown author' }}</p>
        </div>

        <div>
          <ShortlistButton :active="isShortlisted(book.id)" @toggle="toggle(book)" />
        </div>

        <p class="max-w-2xl text-sm leading-relaxed text-surface-800">
          {{ book.description ?? 'No description available for this book.' }}
        </p>

        <dl class="grid max-w-sm grid-cols-2 gap-4 border-t border-surface-200 pt-5 text-sm">
          <div>
            <dt class="font-medium text-surface-600">Publisher</dt>
            <dd class="mt-0.5 text-surface-900">{{ book.publisher ?? 'Unknown' }}</dd>
          </div>
          <div>
            <dt class="font-medium text-surface-600">Pages</dt>
            <dd class="mt-0.5 text-surface-900">{{ book.pageCount ?? 'Unknown' }}</dd>
          </div>
        </dl>

        <div v-if="book.subjects.length > 0" class="border-t border-surface-200 pt-5">
          <h2 class="mb-2.5 text-sm font-medium text-surface-600">Subjects</h2>
          <ul class="flex flex-wrap gap-2">
            <li v-for="subject in book.subjects.slice(0, 12)" :key="subject">
              <NuxtLink
                :to="`/?q=${encodeURIComponent(subject)}`"
                class="inline-block rounded-full bg-surface-100 px-3 py-1 text-xs text-surface-800 transition-colors hover:bg-brand-100 hover:text-brand-700"
              >
                {{ subject }}
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
